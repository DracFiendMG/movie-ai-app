import { getEmbedding, chatCompletions, getMovieImage, supabase } from './config.js';
import movies from './content.js'

let currentPage = 1
let peopleCount = 1
let time = '2 Hours'
let moviePoll = []

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

const main = document.querySelector('main')

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

    const recommendation = await getRecommendation(query, answers)

    movieInterestsForm.reset()
    state.questionsPage = false
    renderMain(recommendation)
}

async function fetchMovies(e) {
    e.preventDefault()

    const response = await getMovieImage('The Martian')
    console.log(response.results[0].poster_path)

    //TODO: https://image.tmdb.org/t/p/[size]/[poster_path]
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

async function createEmbedding(query) {
    const embeddingResponse = await getEmbedding([query])
    return embeddingResponse[0]
}

async function createAndStoreEmbeddings() {
    const movieContentList = movies.map((movie) => movie.content)
    const embeddingResponse = await getEmbedding(movieContentList)
    console.log(embeddingResponse)
    const data = embeddingResponse.map((embedding, index) => {
        return {
            content: movieContentList[index],
            embedding: embedding
        }
    })

    await supabase.from('movies').insert(data)
    console.log('Embeddings stored in Supabase')
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
    // const data = await response.json()
    const recommendation = JSON.parse(response.suggestion)
    console.log('Title:', recommendation.title)
    console.log('Description:', recommendation.description)
    return recommendation
}

function renderMultiPersonViewQuestions(e) {
    e.preventDefault()

    const surveyForm = document.getElementById('survey-form')
    const formData = new FormData(surveyForm)

    peopleCount = formData.get('numberOfPeople')
    time = formData.get('time')

    state.questionsPage = false
    state.multiPersonViewQuestionsPage = true
    state.headingWithTitle = false
    renderHeading()
    renderMain(null)
}

function renderQuestions(e) {
    e.preventDefault()

    const movieInterestsForm = document.getElementById('movie-interests')
    const movieInterestsFormData = new FormData(movieInterestsForm)
    const interests = Object.fromEntries(movieInterestsFormData.entries())

    moviePoll.push(interests)

    console.log(moviePoll)

    currentPage++
    renderHeading()
    renderMain(null)
}

function renderRecommendation() {
    
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
                        <input id="numberOfPeople" type="number" min="1" max="10" step="1" name="numberOfPeople" placeholder="How many people?">
                        <input id="time" type="text" name="time" placeholder="How much time do you have?">
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
                            <textarea id="question-one" name="question-one"></textarea>
                        </div>
                        <div class="question">
                            <p>Are you in the mood for something new or a classic?</p>
                            <div class="selection">
                                <input type="radio" id="new" name="mood" value="new">
                                <label for="new">New</label>
                                <input type="radio" id="classic" name="mood" value="classic">
                                <label for="classic">Classic</label>
                            </div>
                        </div>
                        <div class="question">
                            <p>What are you in the mood for?</p>
                            <div class="selection">
                                <input type="radio" id="fun" name="mood-type" value="fun">
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
                            <textarea id="favorite-actor" name="favorite-actor"></textarea>
                        </div>
                        <button type="submit">${ currentPage < peopleCount ? 'Next Person' : 'Get Movie' }</button>
                    </form>
                </section>
            `

            document
                .getElementById('movie-interests')
                .addEventListener('submit', 
                    currentPage < peopleCount 
                    ? renderQuestions 
                    : renderRecommendation
                )
        } else {
            main.innerHTML = `
                <section id="answers">
                    <div id="movie">
                        <h2 id="title">The Martian (2015)</h2>
                        <img id="poster" src="${imgUrl}" alt="The Martian Movie Poster">
                        <p id="description">The inspiring story of an astronaut stranded on Mars who needs to rely on his ingenuity to come back to Earth</p>
                    </div>
                    <button id="startover">Next Movie</button>
                </section>
            `
            document.getElementById('startover').addEventListener('click', fetchMovies)
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

// createAndStoreEmbeddings()
renderHeading()
renderMain(null)