async function handleFormspreeSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('contact-form-status');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Отправка...';
    
    try {
        const formData = {
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            telegram: form.telegram.value,
            email: form.email.value,
            birthDate: form.birthDate.value || 'Не указана',
            learningFormat: form.querySelector('input[name="learningFormat"]:checked').value,
            message: form.message.value || 'Не указано',
            dataConsent: form.dataConsent.checked ? 'Да' : 'Нет',
            marketingConsent: form.marketingConsent.checked ? 'Да' : 'Нет'
        };
        
        const telegramMessage = `
🎓 <b>Новая заявка на обучение!</b>

👤 <b>Имя:</b> ${formData.firstName} ${formData.lastName}
📱 <b>Telegram:</b> ${formData.telegram}
📧 <b>Email:</b> ${formData.email}
🎂 <b>Дата рождения:</b> ${formData.birthDate}
📚 <b>Формат:</b> ${formData.learningFormat}

💬 <b>Сообщение:</b>
${formData.message}

✅ <b>Согласие на данные:</b> ${formData.dataConsent}
📬 <b>Согласие на рассылку:</b> ${formData.marketingConsent}

⏰ ${new Date().toLocaleString('ru-RU')}
        `.trim();
        
        // ЗАМЕНИТЕ на свои данные из Telegram
        const TELEGRAM_BOT_TOKEN = '8216529528:AAHER15apsFJj8Hhr3BtZkCu3l8IX_m4TF8';
        const TELEGRAM_CHAT_ID = '-4800087723';
        
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'HTML'
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Telegram API error:', errorData);
            throw new Error('Ошибка отправки в Telegram');
        }
        
        statusDiv.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
                    <use xlink:href="#check-circle-fill"/>
                </svg>
                <strong>Отлично!</strong> Ваша заявка успешно отправлена. Мы свяжемся с вами в ближайшее время через Telegram.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        form.reset();
        
    } catch (error) {
        console.error('Ошибка:', error);
        
        statusDiv.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
                <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Error:">
                    <use xlink:href="#exclamation-triangle-fill"/>
                </svg>
                <strong>Ошибка!</strong> Не удалось отправить заявку. Пожалуйста, напишите нам напрямую в 
                <a href="https://t.me/thetutoress" target="_blank" class="alert-link">Telegram</a> или на 
                <a href="mailto:thetutoress.eng@gmail.com" class="alert-link">Email</a>.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '{{ .Site.Params.contact.btnName | default "Отправить заявку" }}';
        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Обработка закрытия алертов
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-close')) {
        e.target.closest('.alert').remove();
    }
});