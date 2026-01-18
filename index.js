import { getEmbedding, chatCompletions, supabase } from './config.js';
import movies from './content.js'

const state = {
    questionsPage: true
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

    await getRecommendation(query, answers)

    movieInterestsForm.reset()
    state.questionsPage = false
    renderMain()
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

    await getChatCompletion(match, qna)
}

async function findNearestMatch(embedding) {
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
            content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given context about movies and the user's preferences through their answers to three questions. Based on this information, recommend a movie that best matches their preferences. If you cannot find a suitable match in the context, say "Sorry, I don't have a recommendation based on your preferences." Do not make up movies that aren't in the context.`
        },
        {
            role: 'user',
            content: `Movie Context:\n${text}\n\nUser Preferences:\n${formattedQnA}\n\nBased on my answers above, what movie would you recommend for me?`
        }
    ]

    const response = await chatCompletions(messages)
    const data = await response.json()
    console.log(data.suggestion)
}

function renderMain() {
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
                    <h2 id="title">School of Rock (2009)</h2>
                    <p id="description">A fun and stupid movie about a wannabe rocker turned fraud substitute teacher forming a rock band with his students to win the Battle of the Bands</p>
                </div>
                <button id="startover">Go Again</button>
            </section>
        `
    }
}

// createAndStoreEmbeddings()

renderMain()