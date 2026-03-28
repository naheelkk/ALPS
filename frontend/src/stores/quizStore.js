import { create } from 'zustand'
import { quizService } from '../services/quizService'

export const useQuizStore = create((set, get) => ({
  currentQuiz: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timeStarted: null,
  questionTimes: {},
  isLoading: false,
  isSubmitting: false,
  result: null,

  startQuiz: async (quizId) => {
    set({ isLoading: true })
    try {
      const data = await quizService.startQuiz(quizId)
      set({
        currentQuiz: data.quiz,
        questions: data.questions,
        currentQuestionIndex: 0,
        answers: {},
        timeStarted: Date.now(),
        questionTimes: {},
        isLoading: false,
        result: null,
      })
      return data
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  setAnswer: (questionId, answer) => {
    const { answers, questionTimes, currentQuestionIndex } = get()
    const now = Date.now()
    
    // Calculate time spent on this question
    const questionStartTime = questionTimes[`start_${questionId}`] || now
    const timeSpent = Math.round((now - questionStartTime) / 1000)
    
    set({
      answers: {
        ...answers,
        [questionId]: {
          answer,
          timeSpent,
          answeredAt: now,
        },
      },
    })
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions, questionTimes } = get()
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      const nextQuestionId = questions[nextIndex].id
      
      set({
        currentQuestionIndex: nextIndex,
        questionTimes: {
          ...questionTimes,
          [`start_${nextQuestionId}`]: Date.now(),
        },
      })
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    }
  },

  goToQuestion: (index) => {
    const { questions, questionTimes } = get()
    if (index >= 0 && index < questions.length) {
      const questionId = questions[index].id
      set({
        currentQuestionIndex: index,
        questionTimes: {
          ...questionTimes,
          [`start_${questionId}`]: Date.now(),
        },
      })
    }
  },

  submitQuiz: async () => {
    const { currentQuiz, answers } = get()
    set({ isSubmitting: true })
    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, data]) => ({
        question_id: questionId,
        selected_answer: data.answer,
        time_spent: data.timeSpent,
      }))

      const result = await quizService.submitQuiz(currentQuiz.id, formattedAnswers)
      set({ result, isSubmitting: false })
      return result
    } catch (error) {
      set({ isSubmitting: false })
      throw error
    }
  },

  resetQuiz: () => {
    set({
      currentQuiz: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      timeStarted: null,
      questionTimes: {},
      result: null,
    })
  },

  fetchResult: async (submissionId) => {
    set({ isLoading: true })
    try {
      const result = await quizService.getQuizResult(submissionId)
      set({ result, isLoading: false })
      return result
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
}))