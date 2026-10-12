import {useState, useEffect, useRef, useCallback} from 'react';
import {api} from './api';

const PHONE_REGEX = /^\d{10,15}$/;

function App() {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const chatIdRef = useRef('');
  const pollingActiveRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const pollNotifications = useCallback(async () => {
    if (pollingActiveRef.current) return;
    pollingActiveRef.current = true;

    while (pollingActiveRef.current) {
      try {
        const notification = await api.receiveNotification(idInstance, apiTokenInstance);

        if (!pollingActiveRef.current) break;

        if (notification && notification.body) {
          const { typeWebhook, messageData, senderData } = notification.body;

          if (
            typeWebhook === 'incomingMessageReceived' &&
            messageData?.messageData?.textMessageData?.textMessage
          ) {
            const incomingChatId = senderData?.chatId ?? '';
            const text = messageData.messageData.textMessageData.textMessage;

            if (incomingChatId && incomingChatId === chatIdRef.current) {
              setMessages((prev) => [
                ...prev,
                {
                  id: notification.receiptId,
                  text,
                  isMy: false,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
            }
          }

          await api.deleteNotification(idInstance, apiTokenInstance, notification.receiptId);
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }, [idInstance, apiTokenInstance]);

  useEffect(() => {
    if (!isLoggedIn) return;

    pollingActiveRef.current = false;
    const timer = setTimeout(pollNotifications, 0);

    return () => {
      clearTimeout(timer);
      pollingActiveRef.current = true;
    };
  }, [isLoggedIn, pollNotifications]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (idInstance.trim() && apiTokenInstance.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleCreateChat = (e) => {
    e.preventDefault();
    const normalized = phoneNumber.replace(/\D/g, '');

    if (!PHONE_REGEX.test(normalized)) {
      setPhoneError('Введите номер от 10 до 15 цифр, например 79991112233');
      return;
    }

    setPhoneError('');
    setChatId(normalized);
    setIsChatOpen(true);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const text = inputMessage;

    try {
      await api.sendMessage(idInstance, apiTokenInstance, chatId, text);
      setMessages((prev) => [
        ...prev,
        {
          id: `out-${Date.now()}`,
          text,
          isMy: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setInputMessage('');
    } catch {
      alert('Ошибка отправки сообщения. Проверьте данные и номер.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login">
        <h2 className="login__title">
          MAX Мессенджер
        </h2>
        <p className="login__text">
          Вход через учетные данные GREEN-API
        </p>
        <form
            onSubmit={handleLogin}
            className="login__form"
        >
          <input
            type="text"
            placeholder="idInstance"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            required
            className="login__input"
          />
          <input
            type="password"
            placeholder="apiTokenInstance"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            required
            className="login__input"
          />
          <button
              type="submit"
              className="login__btn"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Боковая панель */}
      <div className="app__sidebar sidebar">
        <h3 className="sidebar__title">
          MAX Мессенджер
        </h3>
        <form
            onSubmit={handleCreateChat}
            className="sidebar__form"
        >
          <input
            type="text"
            placeholder="Номер телефона (например, 79991112233)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="sidebar__input"
          />
          {phoneError && <span>{phoneError}</span>}
          <button
              type="submit"
              className="sidebar__btn"
          >
            Создать чат
          </button>
        </form>
        <button
            onClick={() => setIsLoggedIn(false)}
            className="sidebar__btn sidebar__btn--logout"
        >
          Выйти
        </button>
      </div>

      {/* Область чата */}
      <div className="app__chat chat">
        {!isChatOpen ? (
          <div className="chat__empty">
            Выберите или создайте чат
          </div>
        ) : (
          <>
            <div className="chat__header">
              Чат с {chatId}
            </div>
            <div className="chat__container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat__message ${msg.isMy ? 'chat__message--is-my' : 'chat__message--is-their'} message`}
                >
                  <div className="message__text">
                    {msg.text}
                  </div>
                  <div className="message__time">
                    {msg.timestamp}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSendMessage}
                className="chat__form"
            >
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="chat__input"
              />
              <button
                  type="submit"
                  disabled={isSending}
                  className="chat__btn"
              >
                {isSending ? '...' : 'Отправить'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
