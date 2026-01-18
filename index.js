import { getEmbedding, chatCompletions, supabase } from './config.js';
import content from './content.js';
import movies from './content.js'

const state = {
    questionsPage: true
}

const main = document.querySelector('main')

// This will be written like this: ${questionOne} ${questionTwo} ${questionThree}`
let questionOne = 'John Carter'
let questionTwo = 'I want to watch a movie released after 1990'
let questionThree = 'I want to watch something serious'
const query = `${questionOne} ${questionTwo} ${questionThree}`

function fetchMovieInterests(e) {
    e.preventDefault()

    const formData = new FormData(movieInterestsForm)
}

// mainFn()
async function mainFn() {
    const embedding = await createEmbedding(query)
    const match = await findNearestMatch(embedding)
    // await getChatCompletion(match, query)
}

async function findNearestMatch(embedding) {
    const { data } = await supabase.rpc('match_movies', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 1
    })

    console.log(data)
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
    const messages = [
        {
            role: 'system',
            content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. If you are unsure and cannot find the answer in the context, say, "Sorry, I don't know the answer." Please do not make up the answer.`
        },
        {
            role: 'user',
            content: `Context: ${text} Question: ${query}`
        }
    ]

    const data = await chatCompletions(messages)
    console.log(data)
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
                <button>Go Again</button>
            </section>
        `
    }
}

// createAndStoreEmbeddings()

renderMain()