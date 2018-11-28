document.querySelector('.filter-btn').addEventListener('click', getCurrency);

// global vars
var currencyName1, currencyCode1, currencyValue1, currencyDate1;

//----------------  DEAL WITH DATE SELECTION  -----------------

function dateControl(e) {
    var calendar1 = document.querySelector('.calendar-1').value; //2018-11-14
    var calendar2 = document.querySelector('.calendar-2').value;

    // disable weekends
    var date1 = new Date(calendar1.replace(/[^\d\-]/g,','));
    var date2 = new Date(calendar2.replace(/[^\d\-]/g,','));
    if(date1.getDay() == 0 || date1.getDay() == 6 ||
        date2.getDay() == 0 || date2.getDay() == 6){
        alert('Savaitgaliais valiutų kursų informacija nenaujinama.');
    } 

    // disable new years, christmas
    var calendar1Year = calendar1.substring(0,4);
    var calendar1Month = calendar1.substring(5,7);
    var calendar1Day = calendar1.substring(8,10);

    var calendar2Year = calendar2.substring(0,4);
    var calendar2Month = calendar2.substring(5,7);
    var calendar2Day = calendar2.substring(8,10);

    if(calendar1Month === '01' && calendar1Day === '01' ||
        calendar1Month === '01' && calendar1Day === '01' ||
        calendar1Month === '12' && calendar1Day === '25' ||
        calendar1Month === '12' && calendar1Day === '25' ||
        calendar1Month === '12' && calendar1Day === '26' ||
        calendar1Month === '12' && calendar1Day === '26' ) {
            alert('Švenčių dienomis valiutų kursų informacija nenaujinama.');
        }

    // disable calendar 2 selection beyond the calendar 1 selected date
    var message = "Data (iki) negali būti ankstesnė nei prieš tai nurodyta data (nuo).";

    if(calendar2 === '') {
        true;
    } else if(calendar1Year > calendar2Year) {
            alert(message);
            e.preventDefault();
    } else if(calendar1Month === calendar2Month &&
        calendar1Day > calendar2Day) {
            alert(message);
            e.preventDefault();
    } else if(calendar1Year === calendar2Year &&
        calendar1Month > calendar2Month) {
            alert(message);
            e.preventDefault();
    }

    // disable date selection beyond current date
    var now = new Date();
    var maxDate = now.toISOString().substring(0,10);

    document.querySelector('.calendar-1').setAttribute('max', maxDate);
    // document.querySelector('.calendar-2').setAttribute('max', maxDate);
    
    // e.preventDefault();
}

//---------------- GET request - AJAX W/ CALLBACKS  -----------------

function get(url, methodType, callback) { // could be GET / DELETE
    var xhr = new XMLHttpRequest();

    xhr.open(methodType, url, true);
    xhr.setRequestHeader( 'Content-type', 'text/xml');
    xhr.setRequestHeader( "Access-Control-Allow-Origin", "*");
    xhr.overrideMimeType('application/xml'); // for parsing the string into valid doc

    xhr.onload = function() {
        if(xhr.status === 200) {
            // console.log(xhr.status);
            var resp = xhr.responseXML.documentElement; // documentElement
            callback(null, resp);
        } else {
            callback('Error: ' + xhr.status);
        }
    }
    xhr.send();
    // console.log(xhr.status ' = request successfully sent'); // 0
}

//-------- REDIRECT TO PROPER F-ION THROUGH EVENT LISTENER --------

function getCurrency() {
    var calendar1 = document.querySelector('.calendar-1').value;
    var calendar2 = document.querySelector('.calendar-2').value;

    dateControl();

    if(calendar2 !== '' && calendar1 !== '') {
        firstSelectedDate();
    } else {
        selectedCurrency();
    }
}

//---------------- F-IONS IN ORDER TO COMPARE CURRENCIES -----------------

function firstSelectedDate() {
    // get the first selected date 
    var date1Selected = document.querySelector('.calendar-1').value;
    
    var url = `https://cors-anywhere.herokuapp.com/https://www.lb.lt/lt/currency/daylyexport/?xml=1&class=Eu&type=day&date_day=${date1Selected}`;
    
    var methodType = "GET";

    get(url, methodType, function(error, resp) {
        if(error) {
            console.log(error);
        } else {
            // get the selected currency      
            var currencySelection = document.querySelector('.currency-selection');
            var currencySelected = currencySelection.options[currencySelection.selectedIndex].value; 
    
            // compare currency selected with currency in db 
            for (var i = 1; i < resp.children.length; i++) {     
                var child = resp.children[i];              
                if(currencySelected === child.children[1].textContent){
                    currencyName1 = child.children[0].textContent; // pavadinimas
                    currencyCode1 = child.children[1].textContent; // kodas
                    currencyValue1 = child.children[2].textContent; // santykis
                    currencyDate1 = child.children[3].textContent; // data
                }
            }
        }
    });
    // to avoid undefined in output
    setTimeout(() => secondSelectedDate(), 1000);
}
function secondSelectedDate() {
    // get the second selected date 
    var date2Selected = document.querySelector('.calendar-2').value;
    
    var url = `https://cors-anywhere.herokuapp.com/https://www.lb.lt/lt/currency/daylyexport/?xml=1&class=Eu&type=day&date_day=${date2Selected}`;
    
    var methodType = "GET";

    get(url, methodType, function(error, resp) {
        if(error) {
            console.log(error);
        } else {
            // get the selected currency      
            var currencySelection = document.querySelector('.currency-selection');
            var currencySelected = currencySelection.options[currencySelection.selectedIndex].value; 
    
            var output = '';

            // compare currency selected with currency in db 
            for (var i = 1; i < resp.children.length; i++) { 
                var child = resp.children[i];        
                if(currencySelected === child.children[1].textContent){

                    // calculate the currency change throughout the selected dates
                    var currencyValue2 = child.children[2].textContent;
                    var currencyValue_2 = parseFloat(currencyValue2.replace(/[^\d\.]/g,'.'));
                    var currencyValue_1 = parseFloat(currencyValue1.replace(/[^\d\.]/g,'.'));
                    var currencyChange = Math.round(((currencyValue_2 - currencyValue_1) / currencyValue_2 * 100) * 10000) / 10000;

                    // output data from both GET requests according to dates and selected currency code 
                    output += `
                        <tr class="tr">    
                            <td class="td-pavadinimas">${child.children[0].textContent}</td>
                            <td class="td-kodas">${child.children[1].textContent}</td>
                            <td class="td-data-nuo">${currencyDate1}</td>
                            <td class="td-santykis-nuo">${currencyValue1}</td>
                            <td class="td-data-iki">${child.children[3].textContent}</td>
                            <td class="td-santykis-iki">${child.children[2].textContent}</td>
                            <td class="td-pokytis">${currencyChange}</td>
                        </tr>  
                    `;
                }
                document.querySelector('.tbody').innerHTML = output;
            }
        }
    });
}

//------------ F-ION TO GET BY 1 DATE / SET CURRENCY  --------------

function selectedCurrency() {
    
    // get the selected date
    var date1Selected = document.querySelector('.calendar-1').value;

    var url = `https://cors-anywhere.herokuapp.com/https://www.lb.lt/lt/currency/daylyexport/?xml=1&class=Eu&type=day&date_day=${date1Selected}`;
    var methodType = "GET";
    
    get(url, methodType, function(error, resp) {
        if(error) {
            console.log(error);
        } else {
            // get the selected currency      
            var currencySelection = document.querySelector('.currency-selection');
            var currencySelected = currencySelection.options[currencySelection.selectedIndex].value; 
    
            var output = '';

            // compare currency selected with currency in db 
            for (var i = 1; i < resp.children.length; i++) {
                var child = resp.children[i];
                if(currencySelected === child.children[1].textContent || 
                    currencySelected === 'all-currencies'){
                    output += `
                       <tr class="tr">                    
                           <td class="td-pavadinimas">${child.children[0].textContent}</td>
                           <td class="td-kodas">${child.children[1].textContent}</td>
                           <td class="td-data-nuo">${child.children[3].textContent}</td>
                           <td class="td-santykis-nuo">${child.children[2].textContent}</td>
                       </tr>  
                   `;
                }
                document.querySelector('.tbody').innerHTML = output;
            }
        }
    });
}
