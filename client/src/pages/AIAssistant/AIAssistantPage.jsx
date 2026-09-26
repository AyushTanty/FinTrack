import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import { Sparkles, Send } from 'lucide-react';
import { askAI, confirmAIAction } from '../../services/aiService';
import AIMessage from '../../components/ai/AIMessage';
import AIConfirmation from '../../components/ai/AIConfirmation';
import SuggestedQuestions from '../../components/ai/SuggestedQuestions';
import { useToast } from '../../context/ToastContext';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const chatEndRef = useRef(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, pendingAction]);

  const handleSend = async (questionOrEvent) => {
    const textToSend = typeof questionOrEvent === 'string' ? questionOrEvent : input;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setPendingAction(null);

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Pass previous history for context continuity
      const response = await askAI(textToSend, month, year, messages);

      const aiMessage = { role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, aiMessage]);

      if (response.actionData) {
        setPendingAction(response.actionData);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I couldn't connect to the AI assistant right now. Your normal FinTrack features are still available."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setConfirmLoading(true);
    try {
      await confirmAIAction(pendingAction);
      showToast('Action saved successfully!', 'success');
      setPendingAction(null);
      setMessages(prev => [...prev, { role: 'assistant', content: "Done! I've recorded that transaction for you." }]);
    } catch (error) {
      showToast('Failed to save action. Please try again.', 'danger');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages(prev => [...prev, { role: 'assistant', content: "No problem, action cancelled." }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedSelect = (question) => {
    handleSend(question);
  };

  return (
    <Container className="py-2">
      <Row className="justify-content-center">
        <Col lg={9} xl={8}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Sparkles size={22} className="text-warning" />
            <h4 className="mb-0 fw-bold text-white tracking-tight">AI Financial Assistant</h4>
          </div>
          <p className="text-secondary small mb-3">Powered by Groq • RAG Context Grounded in Your Records</p>

          <Card className="d-flex flex-column" style={{ minHeight: '620px', backgroundColor: '#1E293B', borderColor: '#334155' }}>
            <Card.Body className="d-flex flex-column overflow-hidden p-0">
              {/* Chat Viewport */}
              <div 
                className="flex-grow-1 p-3 p-md-4 overflow-auto" 
                style={{ backgroundColor: '#0B132B' }}
              >
                {messages.length === 0 ? (
                  <div className="text-center my-auto py-5">
                    <div className="p-3 d-inline-block rounded-circle mb-3" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)' }}>
                      <Sparkles size={36} style={{ color: '#818CF8' }} />
                    </div>
                    <h5 className="text-white fw-semibold">How can I assist your finances today?</h5>
                    <p className="text-secondary small mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
                      Ask questions about spending, balances, upcoming bills, or record transactions via natural language.
                    </p>
                    <div className="d-flex justify-content-center">
                      <SuggestedQuestions onSelect={handleSuggestedSelect} />
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <AIMessage key={idx} role={msg.role} content={msg.content} />
                    ))}
                    
                    {loading && (
                      <div className="d-flex justify-content-start mb-3">
                        <div className="p-3 rounded-3 shadow-sm d-flex align-items-center gap-2" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
                          <Spinner animation="grow" size="sm" variant="primary" />
                          <Spinner animation="grow" size="sm" variant="primary" />
                          <Spinner animation="grow" size="sm" variant="primary" />
                          <span className="text-secondary small ms-1">Thinking...</span>
                        </div>
                      </div>
                    )}
                    
                    {pendingAction && !loading && (
                      <AIConfirmation 
                        actionData={pendingAction} 
                        onConfirm={handleConfirmAction}
                        onCancel={handleCancelAction}
                        loading={confirmLoading}
                      />
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
              
              {/* Input Area */}
              <div className="p-3 border-top" style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="Ask about finances or record an expense (e.g. 'Spent ₹350 on food today')..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading || confirmLoading}
                    className="px-3"
                    style={{
                      backgroundColor: '#0F172A',
                      borderColor: '#475569',
                      color: '#F8FAFC',
                      height: '42px',
                      fontSize: '14px'
                    }}
                  />
                  <Button 
                    className="btn-quick-add d-flex align-items-center gap-1 px-4"
                    style={{ height: '42px' }}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading || confirmLoading}
                  >
                    <Send size={15} />
                    <span>Send</span>
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
