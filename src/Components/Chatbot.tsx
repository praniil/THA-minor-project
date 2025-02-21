import React, { useState, useRef } from 'react';
import { FaUserCircle, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const Chatbot = () => {
  const iconSize = 32;
  const [conversation, setConversation] = useState<{ sender: string; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [modal, setModal] = useState<'feedback' | 'rating' | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const location = useLocation();

  const user_id = location.state?.user_id;
  const user_name = location.state?.user_name || "User";

  const questions = [
    "I'm feeling very sleepy day by day. What can I do?",
    "How can I establish a consistent sleep schedule?",
    "I'm feeling down and don't see the point in anything. Does therapy help?"
  ];

  const userInput = useRef<HTMLInputElement | null>(null);

  const handleSend = async () => {
    if (userInput.current?.value) {
      const userInputText = userInput.current.value;
      setConversation(prev => [...prev, { sender: "user", text: userInputText }]);
      userInput.current.value = "";
      setIsTyping(true);

      try {
        const response = await axios.post("https://tha-minor-project-1.onrender.com/post_userinput", { input: userInputText, user_id });
        setTimeout(() => {
          setConversation(prev => [...prev, { sender: "bot", text: response.data.chatbot_response }]);
          setIsTyping(false);
        }, 1500);
      } catch (error) {
        console.error("Chatbot response error:", error);
        setIsTyping(false);
      }
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return alert("Please enter feedback before submitting.");

    try {
      await axios.post("https://tha-minor-project-1.onrender.com/submit_feedback", { feedback, user_id });
      alert("Thank you for your feedback!");
      setFeedback('');
      setModal(null);
    } catch (error) {
      console.error("Feedback submission error:", error);
    }
  };

  const handleRatingSubmit = async (rate: number) => {
    setRating(rate);
    setModal(null);

    try {
      await axios.post("https://tha-minor-project-1.onrender.com/submit_rating", { rating: rate, user_id });
      alert("Thank you for your rating!");
    } catch (error) {
      console.error("Rating submission error:", error);
    }
  };

  return (
    <div className="bg-gray-200 h-screen p-4 flex gap-2 w-full">
      <div className="w-1/4 bg-gray-400 rounded-md p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Frequent Questions</h2>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <button key={index} onClick={() => userInput.current && (userInput.current.value = question)}
              className="w-full bg-gray-300 rounded p-2 text-left">
              {question}
            </button>
          ))}
        </div>
        <button onClick={() => setModal('feedback')} className="mt-auto p-2 bg-gray-300 rounded">💬 Submit Feedback</button>
        <button onClick={() => setModal('rating')} className="mt-2 p-2 justify-center bg-gray-300 rounded flex items-center gap-2">
          <FaStar /> Rate Us
        </button>
      </div>

      <div className="w-3/4 bg-gray-300 rounded-md p-4 flex flex-col">
        <div className="flex justify-end">
          <FaUserCircle size={iconSize} />
        </div>
        <div className="flex-grow space-y-4 overflow-y-auto p-4">
          <div className="p-2 bg-gray-50 rounded-md w-1/2">Hi {user_name}! How can I help you?</div>
          {conversation.map((msg, index) => (
            <div key={index} className={`p-2 rounded-md min-h-10 w-1/2 ${msg.sender === "user" ? "bg-gray-400 ml-auto" : "bg-gray-50"}`}>
              {msg.text}
            </div>
          ))}
          {isTyping && <div className="p-2 bg-gray-50 rounded-md w-1/2">Bot is typing...</div>}
        </div>
        <div className="flex items-center mt-4">
          <input ref={userInput} type="text" placeholder="Message ChatBot" className="flex-grow p-2 rounded-l-md border" />
          <button onClick={handleSend} className="p-2 bg-gray-400 rounded-r-md">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.003 21L23 12 2.003 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {modal === 'feedback' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md text-center w-96">
            <h2 className="text-lg font-semibold mb-2">Submit Feedback</h2>
            <textarea className="w-full p-2 border rounded" rows={4} placeholder="Write your feedback..."
              value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            <div className="flex justify-between mt-2">
              <button onClick={handleFeedbackSubmit} className="p-2 bg-gray-300 rounded">Submit</button>
              <button onClick={() => setModal(null)} className="p-2 bg-gray-300 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'rating' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md text-center max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Rate Us</h2>
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={24}
                  className={`cursor-pointer ${star <= rating ? "text-yellow-500" : "text-gray-400"}`}
                  onClick={() => handleRatingSubmit(star)}
                />
              ))}
            </div>
            <button onClick={() => setModal(null)} className="mt-2 p-2 bg-gray-300 rounded w-full">
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chatbot;
