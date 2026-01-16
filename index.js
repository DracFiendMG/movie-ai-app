// import { openai, supabase } from './config.js';

const main = document.querySelector('main')

function renderMain() {
    main.innerHTML = `
        <section id="questions">
            <form id="movie-info">
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
}

// renderMain()