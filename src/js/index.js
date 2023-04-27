const previos_transactions = JSON.parse(localStorage.getItem('previos_conversions')) || [];

const env = {
    api_key: "3XVpc8fBx5CWTivgV2VK9wuSDFYQoxpt",
}

const options = (type) => ({
    method: type,
    headers: {
        "Content-Type": "application/json",
        'apikey': env.api_key
    }
})

const date_header_normal = document.querySelector('.date-normal');
const date_header_utc = document.querySelector('.date-UTC');
const data_utc_collapsed = document.querySelector('.date-UTC-collapsed');

const currency_from = document.querySelector('.currency-from');
const currency_to = document.querySelector('.currency-to');

const convertBtn = document.querySelector('.convert-btn');

const currencyLists = document.querySelectorAll('.currency-selector');

const create_UUID = () => {
    let dt = new Date().getTime();
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }

const newElement = (tag, classes) => {
    const element = document.createElement(tag);
    element.classList.add(...classes);
    return element;
}

const createRow = (data, rows) => {
    const row = newElement('div', ['t-row','flex']);
    const row_data = newElement('div', ['row-data', 'grid', `grid-cols-${rows}`, 'justify-center']);
    for(const [key, value] of Object.entries(data)) {
        if(key === 'id') continue;
        const col = document.createElement('div');
        col.classList.add(...['text-gray-600', 'font-thin', 'w-32','text-center']);
        col.innerHTML = value;
        row_data.appendChild(col);
    }
    row.appendChild(row_data);
    return row;
}

const addToHistoric = (data) => {
    const historic = document.querySelector('.historic-table');
    historic.appendChild(createRow(data, 5));
};

const addTotalRate = (data) => {
    const total = document.querySelector('.rate-table');
    total.appendChild(createRow(data, 3));
};

const getDate = () => {
    const date = new Date();

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${dayOfWeek}, ${dayOfMonth}.${month}.${year}`;
}

const getDateUTC = (opt = 'full') => {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const timezoneOffsetMinutes = now.getTimezoneOffset();
    const timezoneOffsetHours = -(timezoneOffsetMinutes / 60);
    const timezoneAbbreviation = 'TBL';

    return { 
        'full' : `Today, ${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`,
        "abr": `${hours}:${minutes}:${seconds}, UTC ${timezoneOffsetHours}${timezoneAbbreviation}`,
        "min": `${day}-${month}-${year}` 
    }[opt];
}

const getCurrencyList = async () => {
    const res = await fetch("https://api.apilayer.com/currency_data/list", options('GET'));
    const data = await res.json();
    return data.currencies;
}

const convertCurrencyRate = async (amount, from, to) => {
    const res = await fetch(`https://api.apilayer.com/currency_data/convert?to=${to}&from=${from}&amount=${amount}`, options('GET'));
    const data = await res.json();
    return data.result;
}

const convertCurrency = async () => {
    if(currency_from.value === '') return console.log('Please enter a number')
    if(currency_from.value < 0) return console.log('Please enter a positive number')
    const from_currency = currencyLists[0].value;
    const to_currency = currencyLists[1].value;
    const amount = currency_from.value;
    const res = await convertCurrencyRate(amount, from_currency, to_currency)
    currency_to.value = res;
    
    const conversion = {"id": create_UUID(), "date": getDateUTC('min'), "from": from_currency, "to": to_currency, "amount": amount, "result": res};
    previos_transactions.push(conversion);

    localStorage.setItem('previos_conversions', JSON.stringify(previos_transactions));
    addToHistoric(conversion);
}

const getCurrencyRate = async () => {
    const res = await fetch("https://api.apilayer.com/currency_data/live?source=USD&currencies=EUR%2CCOP%2CCHF%2CGBP", options('GET'));
    const data = await res.json();
    const rates = data.quotes;
    const parsed_rates = {};
    for (const [key, value] of Object.entries(rates)) {
        parsed_rates[key] = {
            'from': key.slice(0,3),
            'to': key.slice(4,7),
            'rate': value,
        };
    }
    for(const rate of Object.values(parsed_rates)) {
        addTotalRate(rate);
    }
}

for(const transaction of previos_transactions) {
    addToHistoric(transaction, ['historic-table-row', 'grid', 'grid-cols-5', 'justify-center', 'mt-2']);
}

(async () => {
    const available_currencys = await getCurrencyList();
    const options = Object.entries(available_currencys).map(([key, value]) => `<option value="${key}">${key} -  ${value}</option>`).join('');
    currencyLists.forEach(list => list.innerHTML = options);
    getCurrencyRate();
})();

date_header_normal.innerHTML = getDate();
date_header_utc.innerHTML = getDateUTC('abr');
data_utc_collapsed.innerHTML = getDateUTC();

convertBtn.addEventListener('click', convertCurrency);