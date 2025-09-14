let questions = [];
let answers = [];

function saveQuestion(userId, question) {
  const id = `q_${Date.now()}`;
  const questionData = {
    id,
    userId,
    question,
    answerId: `a_${Date.now()}`
  };
  questions.push(questionData);
  return questionData;
}

function getQuestions() {
  return questions;
}

function saveAnswer(questionId, text, visualization) {
  const id = `a_${questionId.split('_')[1]}`;
  const answerData = {
    id,
    text,
    visualization
  };
  answers.push(answerData);
  return answerData;
}

function getAnswer(id) {
  return answers.find(a => a.id === id);
}

module.exports = {
  saveQuestion,
  getQuestions,
  saveAnswer,
  getAnswer
};