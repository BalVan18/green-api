import axios from 'axios';

const API_URL = 'https://api.green-api.com/v3';

export const api = {
    async sendMessage(idInstance, apiTokenInstance, chatId, message) {
        try {
            const response = await axios.post(
                `${API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
                {
                    chatId: chatId,
                    message: message,
                }
            );
            return response.data;
        } catch (error) {
            console.error('Ошибка отправки:', error);
            throw error;
        }
    },

    async receiveNotification(idInstance, apiTokenInstance) {
        try {
            const response = await axios.get(
                `${API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`
            );
            return response.data;
        } catch (error) {
            return null;
        }
    },

    async deleteNotification(idInstance, apiTokenInstance, receiptId) {
        try {
            await axios.delete(
                `${API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`
            );
        } catch (error) {
            console.error('Ошибка удаления уведомления:', error);
        }
    },
};