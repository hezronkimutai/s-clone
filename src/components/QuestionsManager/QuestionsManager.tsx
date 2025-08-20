import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { saveQuestionToFirebase, loadQuestionsFromFirebase, deleteQuestionFromFirebase, saveQuestionsToFirebase } from '../../services/firebase';
import { Question } from '../../types';
import './QuestionsManager.css';

const QuestionsManager: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({
    question: '',
    options: ['', '', '', ''],
    correct: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    // Load existing questions
    loadQuestionsFromFirebase()
      .then(loadedQuestions => {
        setQuestions(loadedQuestions);
        dispatch({ type: 'SET_QUESTIONS', payload: loadedQuestions });
      })
      .catch(error => {
        console.error('Error loading questions:', error);
        (window as any).showToast?.('Failed to load questions', 'error');
      });
  }, [dispatch]);

  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      (window as any).showToast?.('Please add at least one question', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await saveQuestionsToFirebase(questions);
      dispatch({ type: 'SET_QUESTIONS', payload: questions });
      (window as any).showToast?.('Questions saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving questions:', error);
      (window as any).showToast?.('Failed to save questions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim()) {
      (window as any).showToast?.('Please enter a question', 'warning');
      return;
    }

    if (newQuestion.options.some(option => !option.trim())) {
      (window as any).showToast?.('Please fill all answer options', 'warning');
      return;
    }

    if (editingIndex !== null) {
      // Editing existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = { ...newQuestion };
      setQuestions(updatedQuestions);
      setEditingIndex(null);
      (window as any).showToast?.('Question updated!', 'success');
    } else {
      // Adding new question
      setQuestions([...questions, { ...newQuestion }]);
      (window as any).showToast?.('Question added!', 'success');
    }

    // Reset form
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correct: 0
    });
  };

  const editQuestion = (index: number) => {
    setNewQuestion({ ...questions[index] });
    setEditingIndex(index);
  };

  const deleteQuestion = (index: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
      (window as any).showToast?.('Question deleted', 'info');
    }
  };

  const cancelEdit = () => {
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correct: 0
    });
    setEditingIndex(null);
  };

  const addDefaultQuestions = () => {
    const defaultQuestions = [
      {
        question: "What does HTML stand for?",
        options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"],
        correct: 0
      },
      {
        question: "Which of the following is a JavaScript framework?",
        options: ["Python", "React", "HTML", "CSS"],
        correct: 1
      },
      {
        question: "What is the purpose of CSS?",
        options: ["To add interactivity", "To structure content", "To style web pages", "To manage databases"],
        correct: 2
      },
      {
        question: "Which HTTP method is used to retrieve data?",
        options: ["POST", "PUT", "DELETE", "GET"],
        correct: 3
      },
      {
        question: "What does API stand for?",
        options: ["Application Programming Interface", "Advanced Programming Integration", "Automated Program Interaction", "Application Process Integration"],
        correct: 0
      }
    ];

    setQuestions([...questions, ...defaultQuestions]);
    (window as any).showToast?.('Default questions added!', 'success');
  };

  return (
    <div className="questions-manager">
      <div className="container">
        <div className="manager-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1>Manage Questions</h1>
          <p>Add, edit, or remove quiz questions</p>
        </div>

        <div className="manager-content">
          <div className="question-form">
            <h2>{editingIndex !== null ? 'Edit Question' : 'Add New Question'}</h2>
            
            <div className="form-group">
              <label>Question Text</label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            <div className="options-section">
              <label>Answer Options</label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="option-input">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[index] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="correct"
                      checked={newQuestion.correct === index}
                      onChange={() => setNewQuestion({ ...newQuestion, correct: index })}
                    />
                    Correct
                  </label>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button className="btn primary" onClick={addQuestion}>
                {editingIndex !== null ? 'Update Question' : 'Add Question'}
              </button>
              {editingIndex !== null && (
                <button className="btn secondary" onClick={cancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className="questions-list">
            <div className="list-header">
              <h2>Current Questions ({questions.length})</h2>
              <div className="list-actions">
                <button className="btn secondary small" onClick={addDefaultQuestions}>
                  Add Defaults
                </button>
                <button 
                  className="btn primary"
                  onClick={handleSaveQuestions}
                  disabled={isLoading || questions.length === 0}
                >
                  {isLoading ? 'Saving...' : 'Save All Questions'}
                </button>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="empty-state">
                <p>No questions added yet. Start by adding your first question above!</p>
              </div>
            ) : (
              <div className="questions-grid">
                {questions.map((question, index) => (
                  <div key={index} className="question-card">
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <div className="question-actions">
                        <button 
                          className="btn-icon edit"
                          onClick={() => editQuestion(index)}
                          title="Edit Question"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => deleteQuestion(index)}
                          title="Delete Question"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="question-text">{question.question}</div>
                    <div className="question-options">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`option-item ${optIndex === question.correct ? 'correct' : ''}`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsManager;
