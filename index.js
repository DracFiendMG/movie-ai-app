import { 
    getEmbedding, 
    chatCompletions,
    getOMDBMovieImage, 
    supabase 
} from './config.js';

let currentPage = 1
let peopleCount = 1
let time = '2 Hours'
let loadingInterval = null
const moviePoll = []
const recommendationView = []

const view = {
    multiPersonView: true
}

const state = {
    questionsPage: true,
    multiPersonViewQuestionsPage: false,
    headingWithTitle: true
}

const questions = [
    'What’s your favorite movie and why?',
    'Are you in the mood for something new or a classic?',
    'Do you wanna have fun or do you want something serious?'
]

const multiViewQuestions = [
    'What’s your favorite movie and why?',
    'Are you in the mood for something new or a classic?',
    'What are you in the mood for?',
    'Which famous film person would you love to be stranded on an island with and why?'
]

const waitingMessages = [
    "Analyzing cinematic preferences...",
    "Consulting the movie oracle...",
    "Searching the film archives...",
    "Calculating the perfect movie match...",
    "Preparing your personalized movie experience...",
    "Decoding your movie tastes...",
    "Aligning stars for your movie night...",
    "Exploring hidden gems in cinema...",
    "Tuning into your movie vibes...",
    "Crafting the ultimate movie recommendation..."
]

const main = document.querySelector('main')
const header = document.querySelector('header')

async function fetchMovieInterests(e) {
    e.preventDefault()
    
    let query = ``
    let answers = []

    const movieInterestsForm = document.getElementById('movie-interests')

    const formData = new FormData(movieInterestsForm)
    for (const [name, value] of formData) {
        query += `${value}.\n`
        answers.push(value)
    }

    renderLoading()
    const recommendation = await getRecommendation(query, answers)
    stopLoading()

    movieInterestsForm.reset()
    state.questionsPage = false
    renderMain(recommendation)
}

async function getRecommendation(query, answers) {
    const embedding = await createEmbedding(query)
    const match = await findNearestMatch(embedding)

    let qna = answers.map((q, index) => {
        return {
            question: questions[index],
            answer: q
        }
    })

    return await getChatCompletion(match, qna)
}

async function findNearestMatch(embedding) {
    console.log('Finding nearest match for embedding:', embedding)
    const { data } = await supabase.rpc('match_movies', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 1
    })

    return data.map(obj => obj.content).join('\n');
}

async function findNearestMatches(embeddings, count = 3) {
    console.log('Finding nearest matches for embedding:', embeddings)
    const { data } = await supabase.rpc('match_all_movies', {
        query_embeddings: embeddings,
        match_threshold: 0.5,
        match_count: count
    })

    console.log(data)
    return data.map(obj => obj.content);
}

async function createEmbedding(query) {
    const embeddingResponse = await getEmbedding([query])
    return embeddingResponse[0]
}

async function createEmbeddings(queries) {
    const embeddingResponse = await getEmbedding(queries)
    return embeddingResponse.map(embedding => JSON.stringify(embedding))
}

async function getChatCompletion(text, query) {
    const formattedQnA = query.map((item, i) => 
        `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer}`
    ).join('\n\n')

    const messages = [
        {
            role: 'system',
            content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given context about movies and the user's preferences through their answers to three questions. Based on this information, recommend a movie that best matches their preferences. If you cannot find a suitable match in the context, say "Sorry, I don't have a recommendation based on your preferences." Do not make up movies that aren't in the context.
            
Respond ONLY in the following JSON format:
{
    "title": "Movie Title (Year)",
    "description": "A single short paragraph explaining why this movie is perfect for the user based on their preferences."
}`
        },
        {
            role: 'user',
            content: `Movie Context:\n${text}\n\nUser Preferences:\n${formattedQnA}\n\nBased on my answers above, what movie would you recommend for me? Remember to respond in JSON format with title and description.`
        }
    ]

    const response = await chatCompletions(messages)
    const recommendation = JSON.parse(response.suggestion)
    console.log('Title:', recommendation.title)
    console.log('Description:', recommendation.description)
    return recommendation
}

async function getChatCompletionForMultiView(text) {
    const messages = [
        {
            role: 'system',
            content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given context about movies that each person is interested in. Based on this information, recommend a movie that best matches the group's interests. If you cannot find a suitable match in the context, say "Sorry, I don't have a recommendation based on your preferences." Do not make up movies that aren't in the context. The number of recommendations you provide can be less than or equal to the number of people.
Respond ONLY in the following JSON format (Note: Make sure the JSON format is EXACTLY as shown below):
    [{
        "title": "Movie Title",
        "year": "Year",
        "description": "A single short paragraph explaining why this movie is perfect for every person based on their preferences."
    },
    {
        "title": "Movie Title",
        "year": "Year",
        "description": "A single short paragraph explaining why this movie is second choice for every person based on their preferences."
    }]`
        },
        {
            role: 'user',
            content: `Movie Context:\n${text}\n\nBased on the list movies above, what movies would you recommend for the group? Remember to respond in JSON format with title, year, and description.`
        }
    ]

    const response = await chatCompletions(messages)
    const recommendations = JSON.parse(response.suggestion)
    console.log('Recommendations:', recommendations)
    return recommendations
}

async function beautifyQuery(query) {
    const messages = [
        {
            role: 'system',
            content: `You are a helpful assistant that reformats user input into clear and concise queries. 
                    You will be given raw user inputs of multiple persons about their movie preferences. 
                    Your task is to extract the key details and rephrase them into a well-structured query that captures the essence of what the user is looking for in a movie.
                    
                    Respond ONLY in the following JSON format:
                    [ 
                        "Person 1's concise query",
                        "Person 2's concise query",
                        "...",
                        "Person N's concise query",
                        "Maximum available time for the movie session: [time period]"
                    ]
                    `
        },
        {
            role: 'user',
            content: `User Input:\n${query}\n\nPlease reformat the above input into a clear and concise query that captures the user's movie preferences.`
        }
    ]

    const response = await chatCompletions(messages)
    return JSON.parse(response.suggestion)
}

function renderMultiPersonViewQuestions(e) {
    e.preventDefault()

    const surveyForm = document.getElementById('survey-form')
    const formData = new FormData(surveyForm)

    peopleCount = Number(formData.get('numberOfPeople'))
    time = formData.get('time')

    state.questionsPage = false
    state.multiPersonViewQuestionsPage = true
    state.headingWithTitle = false
    renderHeading()
    renderMain(null)
}

function renderLoading() {
    const randomIndex = Math.floor(Math.random() * waitingMessages.length)

    main.innerHTML = `
        <div id="loading">${waitingMessages[randomIndex]}</div>
    `

    loadingInterval = setInterval(() => {
        const newIndex = Math.floor(Math.random() * waitingMessages.length)
        main.innerHTML = `
            <div id="loading">${waitingMessages[newIndex]}</div>
        `
    }, 3000)
}

function stopLoading() {
    if (loadingInterval) {
        clearInterval(loadingInterval)
        loadingInterval = null
    }
}

async function renderQuestions(e) {
    e.preventDefault()

    const movieInterestsForm = document.getElementById('movie-interests')
    const movieInterestsFormData = new FormData(movieInterestsForm)
    const interests = Object.fromEntries(movieInterestsFormData.entries())

    moviePoll.push(interests)

    console.log(moviePoll)

    if (currentPage === peopleCount) {
        console.log('All participants have submitted their answers:', moviePoll)
        state.multiPersonViewQuestionsPage = false
        header.classList.add('hidden')

        renderLoading()

        let queries = await beautifyQuery(interestsToQuery(moviePoll))
        const data = await findNearestMatches(await createEmbeddings(queries), 3)
        const recommendations = await getChatCompletionForMultiView(data.join('\n\n'))
        console.log('Movie recommendation for group:', recommendations)

        await fetchMoviePosterAndDesignView(recommendations)
        renderMain(null)
    } else {
        currentPage++
        renderHeading()
        renderMain(null)
    }
}

function interestsToQuery(interests = moviePoll) {
    let query = ''
    
    interests.forEach((person, index) => {
        query += `Person ${index + 1}:\n`
        let questionIndex = 0
        for (const [question, answer] of Object.entries(person)) {
            query += `${multiViewQuestions[questionIndex++]}: ${answer}.\n`
        }
    })

    query += `\nThe group has a maximum available time of ${time} to watch a movie together.`

    console.log(query)
    return query
}

async function fetchMoviePosterAndDesignView(recommendations) {
    const recommendationPromises = recommendations.map(async (recommendation, index) => {
        const response = await getOMDBMovieImage(recommendation.title)
        console.log(response)
        const posterPath = response.poster

        return `
            <section id="answers">
                <div id="movie">
                    <h2 id="title">${recommendation.title} (${recommendation.year})</h2>
                    <img id="poster" src="${posterPath}" alt="${recommendation.title} Movie Poster">
                    <p id="description">${recommendation.description}</p>
                </div>
                ${recommendations.length - 1 === index 
                    ? `<button id="startover">Start Over</button>` 
                    : `<button id="next">Next Movie</button>`}
            </section>
        `
    })

    const recommendationPromisesResolved = await Promise.all(recommendationPromises)

    recommendationView.push(...recommendationPromisesResolved)
    stopLoading()
    renderRecommendation()
}

function renderRecommendation() {
    main.innerHTML = recommendationView.shift()
    if (recommendationView.length > 0) {
        document.getElementById('next').addEventListener('click', renderRecommendation)
    } else {
        document.getElementById('startover').addEventListener('click', () => {
            state.questionsPage = true
            state.headingWithTitle = true
            header.classList.remove('hidden')

            renderHeading()
            renderMain(null)
        })
    }
}


function renderHeading() {
    const heading = document.getElementById('heading')

    if (state.headingWithTitle) {
        heading.textContent = 'PopChoice'
    } else {
        heading.textContent = currentPage
        heading.style.fontFamily = 'Roboto Slab, serif'
        heading.style.fontSize = '3.125em'
    }
}

function renderMain(recommendation) {
    console.log('Rendering main with state:', state)
    if (view.multiPersonView) {
        if (state.questionsPage) {
            main.innerHTML = `
                <section>
                    <form id="survey-form">
                        <input id="numberOfPeople" type="number" min="1" max="10" step="1" name="numberOfPeople" placeholder="How many people?" required>
                        <input id="time" type="text" name="time" placeholder="How much time do you have?" required>
                        <button type="submit">Start</button>
                    </form>
                </section>
            `
            document.getElementById('survey-form').addEventListener('submit', renderMultiPersonViewQuestions)
        } else if (state.multiPersonViewQuestionsPage) {
            main.innerHTML = `
                <section>
                    <form id="movie-interests">
                        <div class="question">
                            <label for="question-one">What’s your favorite movie and why?</label>
                            <textarea id="question-one" name="question-one" placeholder="Eg. Forrest Gump" required></textarea>
                        </div>
                        <div class="question">
                            <p>Are you in the mood for something new or a classic?</p>
                            <div class="selection">
                                <input type="radio" id="new" name="mood" value="new" required>
                                <label for="new">New</label>
                                <input type="radio" id="classic" name="mood" value="classic">
                                <label for="classic">Classic</label>
                            </div>
                        </div>
                        <div class="question">
                            <p>What are you in the mood for?</p>
                            <div class="selection">
                                <input type="radio" id="fun" name="mood-type" value="fun" required>
                                <label for="fun">Fun</label>
                                <input type="radio" id="serious" name="mood-type" value="serious">
                                <label for="serious">Serious</label>
                                <input type="radio" id="inspiring" name="mood-type" value="inspiring">
                                <label for="inspiring">Inspiring</label>
                                <input type="radio" id="scary" name="mood-type" value="scary">
                                <label for="scary">Scary</label>
                            </div>
                        </div>
                        <div class="question">
                            <label for="favorite-actor">Which famous film person would you love to be stranded on an island with and why?</label>
                            <textarea id="favorite-actor" name="favorite-actor" placeholder="Eg. Tom Hanks" required></textarea>
                        </div>
                        <button type="submit">${ currentPage < peopleCount ? 'Next Person' : 'Get Movie' }</button>
                    </form>
                </section>
            `
            
            document.getElementById('movie-interests').addEventListener('submit', renderQuestions)
        }
    } else {
        if (state.questionsPage) {
            main.innerHTML = `
                <section id="questions">
                    <form id="movie-interests">
                        <div class="question">
                            <label for="question-one">What’s your favorite movie and why?</label>
                            <textarea id="question-one" name="question-one"></textarea>
                        </div>
                        <div class="question">
                            <label for="question-two">Are you in the mood for something new or a classic?</label>
                            <textarea id="question-two" name="question-two"></textarea>
                        </div>
                        <div class="question">
                            <label for="question-three">Do you wanna have fun or do you want something serious?</label>
                            <textarea id="question-three" name="question-three"></textarea>
                        </div>
                        <button>Let's Go</button>
                    </form>
                </section>
            `
            const movieInterestsForm = document.getElementById('movie-interests')
            movieInterestsForm.addEventListener('submit', fetchMovieInterests)
        } else {
            main.innerHTML = `
                <section id="answers">
                    <div id="movie">
                        <h2 id="title">${recommendation.title}</h2>
                        <p id="description">${recommendation.description}</p>
                    </div>
                    <button id="startover">Go Again</button>
                </section>
            `
            document.getElementById('startover').addEventListener('click', () => {
                state.questionsPage = true
                renderMain(null)
            })
        }
    }
}

renderHeading()
renderMain(null)