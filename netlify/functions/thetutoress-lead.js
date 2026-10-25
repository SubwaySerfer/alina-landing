const FORMATS = ['Индивидуальные занятия', 'Парные занятия', 'Групповые занятия', 'Разговорный клуб'];

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, message: 'Method not allowed' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { success: false, message: 'Некорректные данные' });
  }

  // Honeypot: боты заполняют скрытое поле, людям оно не видно
  if (data.website) {
    return json(200, { success: true });
  }

  const firstName = str(data.firstName, 100);
  const lastName = str(data.lastName, 100);
  const telegram = str(data.telegram, 100);
  const email = str(data.email, 200);
  const birthDate = str(data.birthDate, 50);
  const learningFormat = str(data.learningFormat, 100);
  const message = str(data.message, 1000);

  if (firstName.length < 2 || lastName.length < 2 || telegram.length < 3) {
    return json(400, { success: false, message: 'Некорректные данные' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { success: false, message: 'Некорректный email' });
  }
  if (!FORMATS.includes(learningFormat)) {
    return json(400, { success: false, message: 'Некорректный формат обучения' });
  }
  if (data.dataConsent !== true) {
    return json(400, {
      success: false,
      message: 'Необходимо дать согласие на обработку персональных данных'
    });
  }

  const token = process.env.THETUTORESS_BOT_TOKEN;
  const chatId = process.env.THETUTORESS_CHAT_ID;
  if (!token || !chatId) {
    console.error('THETUTORESS_BOT_TOKEN / THETUTORESS_CHAT_ID не заданы');
    return json(500, { success: false, message: 'Ошибка сервера' });
  }

  const text = `
🎓 <b>НОВАЯ ЗАЯВКА - THETUTORESS</b>

👤 <b>Студент:</b> ${escapeHtml(firstName)} ${escapeHtml(lastName)}
📱 <b>Telegram:</b> ${escapeHtml(telegram)}
📧 <b>Email:</b> ${escapeHtml(email)}
${birthDate ? `🎂 <b>Дата рождения:</b> ${escapeHtml(birthDate)}` : ''}

📚 <b>Формат обучения:</b> ${escapeHtml(learningFormat)}
${message ? `💬 <b>Запрос:</b> ${escapeHtml(message)}` : ''}

✅ <b>Согласие на данные:</b> Да
📬 <b>Согласие на рассылку:</b> ${data.marketingConsent === true ? 'Да' : 'Нет'}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Novosibirsk' })}
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    if (!res.ok) {
      console.error('Ошибка Telegram:', res.status, await res.text());
      return json(502, { success: false, message: 'Ошибка отправки' });
    }
  } catch (err) {
    console.error('Ошибка Telegram:', err.message);
    return json(502, { success: false, message: 'Ошибка отправки' });
  }

  return json(200, { success: true, message: 'Заявка успешно отправлена!' });
};
