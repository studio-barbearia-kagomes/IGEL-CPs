/*
  CONFIGURAÇÃO DO SITE
  Edite os serviços, o WhatsApp e o horário de atendimento neste arquivo.
  O WhatsApp deve conter código do país + DDD + número, só números.
*/
const CONFIG = {
  whatsapp: "5511962243984",
  openingTime: "09:00",
  closingTime: "21:00",
  intervalMinutes: 30,
  // Tempo estimado de espera na barbearia, em minutos. Altere conforme necessário.
  waitTimeMinutes: 15,
  services: [
    { name: "Corte", price: 50, duration: 50 },
    { name: "Corte Social (Tesoura)", price: 70, duration: 45 },
    { name: "Sobrancelhas", price: 20, duration: 10 },
    { name: "Barba Tradicional (Sem Degradê)", price: 20, duration: 15 },
    { name: "Barba com Degradê", price: 30, duration: 30 },
    { name: "Cavanhaque", price: 15, duration: 10 },
    { name: "Penteado com laque", price: 25, duration: 20 },
    { name: "Penteado com pomada", price: 10, duration: 10 },
    { name: "Hidratação", price: 40, duration: 30 },
    { name: "Definitiva", price: 130, duration: 120, note: "Corte não incluso" },
    { name: "Botox", price: 100, duration: 90, note: "Corte não incluso" },
    { name: "Luzes Platinada", price: 120, duration: 180, note: "Corte não incluso" },
     { name: "Platinado/Global", price: 150, duration: 240, note: "Corte não incluso" },
    { name: "Mensalista", price: 0, duration: 50 },
    { name: "Renovação Mensalista", price: 200, duration: 50 }
  ]
};


const $ = (selector) => document.querySelector(selector);
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const serviceList = $("#service-list");
const serviceSelect = $("#service");
const dateInput = $("#date");
const timeSelect = $("#time");
const priceDisplay = $("#selected-price");
const formMessage = $("#form-message");

async function loadPublicServices() {
  try {
    const response = await fetch(
      "https://vbuwroxufbcisrzzftjm.supabase.co/rest/v1/services?select=id,name,price_cents,duration_minutes,is_active,display_order&is_active=eq.true&order=display_order.asc,name.asc",
      {
        headers: {
          apikey: "sb_publishable_14T2-_L2CtWMKCi5Noiw2g_GqQcV4mH",
          Authorization: "Bearer sb_publishable_14T2-_L2CtWMKCi5Noiw2g_GqQcV4mH"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao consultar serviços: HTTP " + response.status);
    }

    const rows = await response.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("Nenhum serviço ativo retornado pelo Supabase.");
    }

    CONFIG.services = rows.map(service => ({
      name: service.name,
      price: Number(service.price_cents || 0) / 100,
      duration: Number(service.duration_minutes || 30)
    }));

    serviceList.replaceChildren();
    serviceSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecione um serviço";
    serviceSelect.appendChild(placeholder);

    renderServices();
    updatePrice();

  } catch (error) {
    console.error("Falha ao carregar serviços do Supabase:", error);

    formMessage.textContent =
      "Não foi possível atualizar os serviços. Os serviços cadastrados anteriormente continuam disponíveis.";

   loadPublicServices();
setupDateLimits();
fillTimes();
updatePrice();
  }
}

function renderServices() {
  CONFIG.services.forEach((service, index) => {
    const item = document.createElement("article");
    item.className = "service-item";
    const info = document.createElement("div");
    info.className = "service-info";
    const name = document.createElement("h3");
    name.textContent = service.name;
    info.appendChild(name);
    const note = document.createElement("p");
    note.textContent = `${service.duration} minutos${service.note ? " • " + service.note : ""}`;
    info.appendChild(note);
    const price = document.createElement("strong");
    price.className = "service-price";
    price.textContent = money(service.price);
    item.append(info, price);
    serviceList.appendChild(item);

    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${service.name} — ${money(service.price)} — ${service.duration} min${service.note ? " (" + service.note + ")" : ""}`;
    serviceSelect.appendChild(option);
  });
}
function parseTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
function formatTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
function fillTimes() {
  const chosenDate = dateInput.value;
  const service = CONFIG.services[Number(serviceSelect.value)];
  timeSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = !service
    ? "Escolha o serviço primeiro"
    : (chosenDate ? "Selecione um horário" : "Escolha a data primeiro");
  timeSelect.appendChild(placeholder);
  if (!chosenDate || !service) return;

  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const first = parseTime(CONFIG.openingTime);
  const last = parseTime(CONFIG.closingTime);
  const latestStart = last - service.duration;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let mins = first; mins <= latestStart; mins += CONFIG.intervalMinutes) {
    if (chosenDate === todayLocal && mins <= currentMinutes) continue;
    const option = document.createElement("option");
    option.value = formatTime(mins);
    option.textContent = `${formatTime(mins)} (termina às ${formatTime(mins + service.duration)})`;
    timeSelect.appendChild(option);
  }
  if (timeSelect.options.length === 1) {
    placeholder.textContent = latestStart < first
      ? "Esse serviço não cabe no horário de atendimento"
      : "Sem horários disponíveis nesta data";
  }
}
function updatePrice() {
  const service = CONFIG.services[Number(serviceSelect.value)];
  priceDisplay.textContent = service ? `${money(service.price)} · ${service.duration} min` : "—";
  fillTimes();
}

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function setupDateLimits() {
  dateInput.min = localDateString(new Date());
}
function openWhatsApp(message) {
  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

renderServices();
setupDateLimits();
fillTimes();
updatePrice();
$("#wait-time-display").textContent = CONFIG.waitTimeMinutes;
$("#year").textContent = new Date().getFullYear();
$("#direct-whatsapp").href = `https://wa.me/${CONFIG.whatsapp}`;
$("#floating-whatsapp").href = `https://wa.me/${CONFIG.whatsapp}`;
dateInput.addEventListener("change", fillTimes);
serviceSelect.addEventListener("change", updatePrice);
$("#booking-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#customer-name").value.trim();
  const service = CONFIG.services[Number(serviceSelect.value)];
  const date = dateInput.value;
  const time = timeSelect.value;
  const notes = $("#notes").value.trim();
  if (!name || !service || !date || !time) {
    formMessage.textContent = "Preencha nome, serviço, data e horário para continuar.";
    return;
  }
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}/${month}/${year}`;
  const lines = [
    "Olá! Quero solicitar um agendamento na Studio Barbearia KaGomes.",
    "",
    `Nome: ${name}`,
    `Serviço: ${service.name}`,
    `Valor: ${money(service.price)}`,
    `Duração estimada: ${service.duration} minutos`,
    `Data desejada: ${formattedDate}`,
    `Horário desejado: ${time}`,
    `Término estimado: ${formatTime(parseTime(time) + service.duration)}`,
    `Tempo de espera estimado no local: até cerca de ${CONFIG.waitTimeMinutes} minutos (pode variar).`,
    notes ? `Observações: ${notes}` : "",
    "",
    "POLÍTICAS IMPORTANTES:",
    "• Cancelamentos somente podem ser solicitados com pelo menos 24 horas de antecedência do horário agendado.",
    "• Em dezembro, os valores dos serviços poderão sofrer alterações. Confirmarei o valor atualizado com a barbearia.",
    "",
    "Se esse horário estiver disponível, pode confirmar para mim? Sei que o agendamento depende da confirmação da barbearia."
  ].filter(Boolean);
  formMessage.textContent = "Abrindo o WhatsApp com seu pedido. Envie a mensagem para concluir.";
  openWhatsApp(lines.join("\n"));
});
