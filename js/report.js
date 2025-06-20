function formatDate(date, format) {
    const pad = (num) => String(num).padStart(2, '0');
    
    const replacements = {
        'yyyy': date.getFullYear(),
        'mm': pad(date.getMonth() + 1),
        'dd': pad(date.getDate()),
        'HH': pad(date.getHours()),
        'MM': pad(date.getMinutes()),
        'ss': pad(date.getSeconds())
    };

    return format.replace(/yyyy|mm|dd|HH|MM|ss/g, match => replacements[match]);
}

let TODAY			= -1;
let DATATIME 		= formatDate(new Date(), "yyyymmddHHMMss");
let DATA			= [];
let sessionIntervalId = null;
let activityIntervalId = null;
let DAYS			= [];
let LOCATIONS		= [];
let WORKERS			= [];
let TABEL			= [];
let FILTER			= [];
let QUEUE 			= [];
let CANVASES 		= [];
let wShortDays		= ["пн","вт","ср","чт","пт","сб","вс"];
let selectedCells 	= [];
let symbolsDi 		= ['0','1','2','3','4','5','6','7','8','9'];
let symbolsRu 		= ['я','д','к','н','в','у','б','п','ж','о','т','м','р','г','к','с','п','ч'];
let symbolsEn 		= ['z','l','r','y','d','e',',','g',';','j','n','v','h','u','g','x'];
let codesDi 		= ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'];
let codesRu1 		= ['Я','Б','МО','Д','ОТ','ОБ','ОД','СО','ОЖ','НН','НВ','Г','Р','У','УВ','ПК','В','К','ДО','ПЧ'];
let codesRu 		= ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','Я','Б','МО','Д','ОТ','ОБ','ОД','СО','ОЖ','НН','НВ','Г','Р','У','УВ','ПК','В','К','ДО','ПЧ'];
let mFullDays		= ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
let mouseUp 		= false;
let mouseDown 		= false;
let isLeftMB		= false;
let isRightMB		= false;
let selectedFnt		= '#000000';
let YaFnt			= '#c80000';
let unselectedFnt	= '#000000';
let selectedBgd		= '#6690ef';
let unselectedBgd	= '#f6f7f6';
let unselectedNoBgd	= '#e7e77e';
let todayBgd		= '#ff0000';
let weekendBgd		= 'repeating-linear-gradient(-45deg, #d7db00 0px, #d7db00 2px, #ddd 2px, #ddd 5px)';
let lastSelectedCellForComment = null;
let VER 			= "22";


let TIMESTAMP_SESSION	= Math.floor(Date.now() / 1000);
let TIMESTAMP_ACTIVITY 	= Math.floor(Date.now() / 1000);

let wasShift = false;

window.AUTH_HEADER = 'Basic d2ViOkFTRHFhejEyMw==';

function getAuthHeaderForReport() {
    return window.AUTH_HEADER || null;
  }


document.addEventListener("mousedown", 	setMouseDownState);
document.addEventListener("mousemove", 	setMouseDownState);
document.addEventListener("mouseup", 	setMouseUpState);
document.addEventListener('keydown', 	setCellVal);
document.addEventListener('scroll', 	scrollDocument);

document.addEventListener('mousedown', function(e) {
    console.log('[DEBUG] mousedown document', e.target);
}, true);


function setViewMode(isReadonly) {
    console.log('[DEBUG] Установка режима просмотра:', isReadonly);
    
    // Устанавливаем куку
    setFullReadonlyCookie(isReadonly);
    
    // Обновляем глобальную переменную
    window.IS_FULL_READONLY = isReadonly;
    
    // Обновляем текст кнопки
    const viewButton = $('#menu-fullreadonly');
    console.log('[DEBUG] Кнопка найдена:', viewButton.length > 0);
    if (viewButton.length > 0) {
        viewButton.text(isReadonly ? 'Изменить' : 'Смотреть');
        console.log('[DEBUG] Текст кнопки изменен на:', isReadonly ? 'Изменить' : 'Смотреть');
    } else {
        console.log('[DEBUG] Кнопка не найдена в DOM');
    }
    
    // Сохраняем текущую дату
    const currentDate = getCookie('LAST_DAY_OF_MONTH');
    
    // Перезагружаем данные таблицы
    getDataTabel(
        true,  // loader
        false, // hideAfter
        window.UID,
        currentDate, // date
        false, // update
        isReadonly  // fullReadonly
    );
}

// Инициализация при загрузке страницы
$(document).ready(function() {
    console.log('[DEBUG] Инициализация при загрузке страницы');
    
    // Проверяем существование кнопки
    if ($('#menu-fullreadonly').length === 0) {
        console.log('[DEBUG] Создаем кнопку просмотра');
        // Создаем кнопку, если её нет
        $('<button>', {
            id: 'menu-fullreadonly',
            class: 'menu-button',
            text: 'Смотреть'
        }).appendTo('#menu-container'); // Замените #menu-container на правильный селектор
    }
    
    // Инициализируем состояние кнопки
    const currentMode = getFullReadonlyCookie();
    console.log('[DEBUG] Текущий режим:', currentMode);
    window.IS_FULL_READONLY = currentMode;
    
    const viewButton = $('#menu-fullreadonly');
    if (viewButton.length > 0) {
        viewButton.text(currentMode ? 'Изменить' : 'Смотреть');
        console.log('[DEBUG] Установлен начальный текст кнопки:', currentMode ? 'Изменить' : 'Смотреть');
    }
    
    // Обработчик клика по кнопке
    $(document).on('click', '#menu-fullreadonly', function() {
        console.log('[DEBUG] Клик по кнопке просмотра');
        setViewMode(!window.IS_FULL_READONLY);
    });
});

function isColSelection() {
    return lastColSelectionByHeader === true;
}

// Функция для установки куки
function setFullReadonlyCookie(value) {
    document.cookie = `FULL_READONLY_MODE=${value ? 'true' : 'false'}; path=/; max-age=31536000`;
    console.log('[DEBUG] Установлена кука FULL_READONLY_MODE:', value);
}

function getFullReadonlyCookie() {
    const isReadonly = getCookie('FULL_READONLY_MODE') === 'true';
    if (isReadonly) {
        // При получении режима просмотра, восстанавливаем сохраненную дату
        const savedDate = getCookie('LAST_READONLY_DATE');
        if (savedDate) {
            setCookie('LAST_DAY_OF_MONTH', savedDate, 365);
        }
    }
    return isReadonly;
}

function getReadAllCookie() {
    const match = document.cookie.match(/readAll=([^;]+)/);
    return match ? match[1] === 'true' : false;
}
// === Глобальная функция для установки куки readAll ===
function setReadAllCookie(value) {
    document.cookie = `readAll=${value}; path=/; max-age=31536000`;
}

$(document).ready(function() {
    if (!sessionIntervalId) {
        sessionIntervalId = setInterval(() => checkSession(), 60*1000);
    }
    if (!activityIntervalId) {
        activityIntervalId = setInterval(() => checkActivity(), 10*1000);
    }
    checkTabelWindowSize();
    $(window).on('resize', checkTabelWindowSize);

    // === Модальное окно для отчетов ===
    if ($('#reports-modal').length === 0) {
      $('body').append(`
        <div id="reports-modal" style="display:none;position:fixed;z-index:10001;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);" class="reports-modal-center">
          <div id="reports-modal-content" style="background:#fff;padding:32px 36px 24px 36px;border-radius:12px;box-shadow:0 4px 24px #0002;min-width:320px;max-width:96vw;max-height:90vh;position:relative;">
            <div style="font-size:22px;font-weight:bold;margin-bottom:18px;">Выберите отчет</div>
            <div style="margin-bottom:18px;">
              <label style="display:block;margin-bottom:8px;"><input type="radio" name="report-groupby" value="firms"> Табель с группировкой по организациям</label>
              <label style="display:block;"><input type="radio" name="report-groupby" value="locations"> Табель с группировкой по объектам</label>
            </div>
            <div style="margin-bottom:18px;">
  <label for="report-period" style="font-weight:bold;">Период:</label>
  <select id="report-period" style="margin-left:10px; font-size:15px;">
    <option value="0" selected>Весь месяц</option>
    <option value="1">1-я половина месяца (до 15 числа)</option>
  </select>
</div>
            <div style="display:flex;gap:18px;justify-content:center;margin-top:18px;">
              <button id="report-pdf-btn" class="btn btn-primary" style="padding:8px 24px;font-size:16px;">PDF</button>
              <button id="report-xlsx-btn" class="btn btn-secondary" style="padding:8px 24px;font-size:16px;">Excel</button>
            </div>
            <button id="reports-modal-close" style="position:absolute;top:8px;right:12px;font-size:22px;background:none;border:none;color:#888;cursor:pointer;">&times;</button>
          </div>
          <div id="reports-modal-spinner" style="display:none;position:absolute;top:0;left:0;width:100vw;height:100vh;background:rgba(255,255,255,0.5);z-index:10002;align-items:center;justify-content:center;">
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
              <div class="spinner" style="border:6px solid #eee;border-top:6px solid #0071c8;border-radius:50%;width:48px;height:48px;animation:spin 1s linear infinite;"></div>
              <div style="margin-top:18px;font-size:18px;color:#0071c8;">Загрузка отчёта...</div>
            </div>
          </div>
        </div>
        <style>
          .reports-modal-center {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          @keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        </style>
      `);
    }

    // === Модальное окно для переноса сотрудника ===
    if ($('#move-worker-modal').length === 0) {
      $('body').append(`
        <div id="move-worker-modal" style="display:none;position:fixed;z-index:10001;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);" class="reports-modal-center">
          <div id="move-worker-modal-content" style="background:#fff;padding:24px 36px;border-radius:12px;box-shadow:0 4px 24px #0002;min-width:320px;max-width:96vw;position:relative;">
            <div style="font-size:20px;font-weight:bold;margin-bottom:18px;" id="move-worker-modal-title">Последняя дата работы на объекте</div>
            <div style="margin-bottom:18px;">
              <p style="margin-bottom: 10px;">Сотрудник: <strong id="move-worker-name"></strong></p>
              <label for="move-worker-date">Дата:</label>
              <input type="date" id="move-worker-date" style="font-size:16px;padding:4px 6px;margin-left: 10px;">
            </div>
            <div style="margin-bottom:18px;">
              <label style="display:block;"><input type="checkbox" id="split-hours-checkbox" checked> Разделить часы (поставить "СО" на выбранную дату)</label>
            </div>
            <div style="display:flex;gap:18px;justify-content:flex-end;margin-top:18px;">
              <button id="move-worker-save-btn" class="btn btn-primary" style="padding:8px 24px;font-size:16px;">Сохранить</button>
              <button id="move-worker-cancel-btn" class="btn btn-secondary" style="padding:8px 24px;font-size:16px;">Отмена</button>
            </div>
            <button id="move-worker-modal-close" style="position:absolute;top:8px;right:12px;font-size:22px;background:none;border:none;color:#888;cursor:pointer;">&times;</button>
          </div>
        </div>
      `);
    }

    $('#menu-reports').off('click.reportsModal').on('click.reportsModal', function(e) {
      $('#reports-modal').fadeIn(120);
      logUserAction('openReportsModal');
    });

    $(document).on('click', '#reports-modal-close', function() {
      $('#reports-modal').fadeOut(120);
      logUserAction('closeReportsModal');
    });
    // Клик вне окна — закрыть
    $(document).on('mousedown', function(e) {
      if ($('#reports-modal').is(':visible') && !$(e.target).closest('#reports-modal-content').length && !$(e.target).is('#menu-reports')) {
        $('#reports-modal').fadeOut(120);
      }
    });

    $(document).off('click.reportDownload').on('click.reportDownload', '#report-pdf-btn, #report-xlsx-btn', function() {
        let groupby = $("input[name='report-groupby']:checked").val();
        let type = $(this).attr('id') === 'report-pdf-btn' ? 'pdf' : 'xlsx';
        let period = $('#report-period').val();
        downloadReportWithAuth(groupby, type, period);
        $('#reports-modal').fadeOut(120);
      });
    // Добавляем кнопку "Табель (только просмотр)" рядом с "Отчёты"
    if ($('#menu-fullreadonly').length === 0) {
        $('#menu-reports').after('<button id="menu-fullreadonly" class="menu-button" style="margin-left:12px; background:#999999;color:#fff;border:none;display:none;">Смотреть</button>');
    }


    // === МЕНЮ ДЛЯ FIXSTATE ===
    if ($('#fixstate-menu').length === 0) {
        $('body').append(`
            <div id="fixstate-menu" style="display:none;position:absolute;z-index:0;background:#fffbe6;border:1px solid #e6b800;padding:16px 20px;border-radius:10px;box-shadow:0 2px 8px #0002;min-width:220px;">
                <div style="font-size:17px;font-weight:bold;margin-bottom:10px;">Изменить фикс. состояние</div>
                <div style="margin-bottom:10px;">
                    <label>Код:<br>
                        <select id="fixstate-code-select" style="width:100%;font-size:16px;padding:4px 6px;"></select>
                    </label>
                </div>
                <div style="margin-bottom:14px;">
                    <label>Часы:<br>
                        <select id="fixstate-hours-select" style="width:100%;font-size:16px;padding:4px 6px;">
                            <option value="">-</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                        </select>
                    </label>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button id="fixstate-save-btn" class="btn btn-primary" style="padding:6px 18px;font-size:15px;">Сохранить</button>
                    <button id="fixstate-cancel-btn" class="btn btn-secondary" style="padding:6px 18px;font-size:15px;">Отмена</button>
                </div>
            </div>
        `);
    }

    // Заполняем коды
    let $codeSelect = $('#fixstate-code-select');
    $codeSelect.empty();
    for (let code of codesRu1) {
        $codeSelect.append(`<option value="${code}">${code}</option>`);
    }

    // Обработчик клика по фиксированной ячейке
    $(document).on('click', '.cell-fixed, [data-fixed="1"]', function(e) {
        if (window.IS_FULL_READONLY) return; // Запрет в режиме только для чтения
        e.stopPropagation();
        let $cell = $(this);
        let id = $cell.attr('id');
        let match = id && id.match(/^(\d+)-(\d+)-day-dv$/);
        if (!match) return;
        let row = parseInt(match[1], 10) - 1;
        let col = parseInt(match[2], 10) - 1;
        // Сохраняем в data атрибуты для дальнейшего использования
        $('#fixstate-menu').data('row', row).data('col', col);
        // Устанавливаем текущие значения
        let uid = WORKERS[row]['uid'];
        let no = row + 1;
        let tabelId = no + '_' + uid;
        let dayObj = TABEL[tabelId][col];
        $codeSelect.val(dayObj['vt'] || codesRu1[0]);
        $('#fixstate-hours-select').val(dayObj['hours'] || '');
        // Показываем меню рядом с ячейкой
        let offset = $cell.offset();
        let menuW = $('#fixstate-menu').outerWidth();
        let menuH = $('#fixstate-menu').outerHeight();
        let left = offset.left;
        let top = offset.top + $cell.outerHeight();
        // Если не влезает справа — сдвигаем влево
        if (left + menuW > $(window).width() - 10) left = $(window).width() - menuW - 10;
        if (left < 10) left = 10;
        // Если не влезает снизу — показываем выше
        if (top + menuH > $(window).height() + $(window).scrollTop() - 10) {
            top = offset.top - menuH;
            if (top < 10) top = 10;
        }
        $('#fixstate-menu').css({left: left, top: top, display: 'block'});
    });

    // Сохранить изменения
    $(document).on('click', '#fixstate-save-btn', async function() {
        let row = $('#fixstate-menu').data('row');
        let col = $('#fixstate-menu').data('col');
        let code = $('#fixstate-code-select').val();
        let hours = $('#fixstate-hours-select').val();
        let uid = WORKERS[row]['uid'];
        let no = row + 1;
        let tabelId = no + '_' + uid;
        // Обновляем данные
        TABEL[tabelId][col]['vt'] = code;
        TABEL[tabelId][col]['hours'] = hours === '' ? 0 : Number(hours);
        // Фиксируем изменение для отправки на сервер
        if (!changedCells[tabelId]) changedCells[tabelId] = {};
        changedCells[tabelId][col] = TABEL[tabelId][col];
        TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
        // Обновляем отображение ячейки
        let htmlValue = '';
        if (code && (!hours || hours == 0)) {
            htmlValue = `<span class="cell-code-big">${code}</span>`;
        } else if (code && hours) {
            htmlValue = `<span class="cell-code-small">${code}</span><span class="cell-hours-big">${hours}</span>`;
        }
        htmlValue += `<div id="${row+1}-${col+1}-day-comment" class="days-comment" title="${TABEL[tabelId][col]['comment']||''}"></div>`;
        $('#' + (row+1) + '-' + (col+1) + '-day-dv').html(htmlValue).css({"color": selectedFnt, "font-weight": "normal"});
        // Отправляем на сервер
        await sendDataTabel(false);
        $('#fixstate-menu').hide();
    });

    // Отмена
    $(document).on('click', '#fixstate-cancel-btn', function() {
        $('#fixstate-menu').hide();
    });

    // Клик вне меню — закрыть
    $(document).on('mousedown', function(e) {
        if ($('#fixstate-menu').is(':visible') && !$(e.target).closest('#fixstate-menu').length && !$(e.target).hasClass('cell-fixed')) {
            $('#fixstate-menu').hide();
        }
    });
});


// CREATE ===========================

function checkSession(){
	if((Math.floor(Date.now() / 1000) - TIMESTAMP_SESSION) > 3600){
		toPage('exit');
	}
}

function checkActivity(){
    if((Math.floor(Date.now() / 1000) - TIMESTAMP_ACTIVITY) > 10){
        console.log('[Табель] Автообновление данных: ', new Date().toLocaleString());
        if(window.lastTabelRequestArgs) {
            let args = Object.values(window.lastTabelRequestArgs);
            if(args.length >= 1) args[0] = false; // loader = false
            if(args.length >= 5) args[4] = true;  // update = true
            getDataTabel.apply(null, args);
        } else {
            getDataTabel(false, false, UID, DATATIME, lastDayDate, true);
        }
    }
}

async function getDataTabel(loader=true, hideAfter=false, UID, date, update=false, fullReadonly=false) {
    // Проверяем режим только для чтения из куки, если параметр не передан
    if (fullReadonly === false) {
        fullReadonly = getFullReadonlyCookie();
    }
    
    window.lastTabelRequestArgs = {loader, hideAfter, UID, date, update, fullReadonly};
    window.IS_FULL_READONLY = !!fullReadonly;
    setFullReadonlyCookie(fullReadonly);
    
    if (window.IS_FULL_READONLY) unselectCells();
    console.log('getDataTabel вызван с параметрами:', {loader, hideAfter, UID, date, update, fullReadonly});
    if(!UID) return;

    // Получаем дату из куки LAST_DAY_OF_MONTH если она есть
    const lastDayOfMonth = getCookie('LAST_DAY_OF_MONTH');
    if (lastDayOfMonth) {
        date = lastDayOfMonth;
    }
    
    // Форматируем дату для запроса
    const formattedDate = formatDate(new Date(date), 'YYYYMMDDHHmmss');
    const endOfMonth = formatDate(new Date(date), 'YYYYMMDD') + '235959';
    
    // Параметры запроса
    const params = [
        UID,
        formattedDate,
        endOfMonth,
        update,
        fullReadonly  // Используем проверенное значение fullReadonly
    ];
    
    console.log('[getDataTabel] Итоговые параметры запроса:', params);

    // 1. Если дата не указана (первая загрузка) — берем текущую дату
    if (!date) {
        date = new Date().format("yyyymmddHHMMss");
        console.log('[getDataTabel] Первая загрузка, используем текущую дату:', date);
    } else {
        // 2. Если дата указана — это может быть дата из cookie (последний успешный запрос)
        console.log('[getDataTabel] Используем переданную дату:', date);
    }

    let lastDayDate = null;
    let args = [UID, date];

    // Проверяем, является ли выбранный месяц прошлым
    let selectedDate = new Date(date.substring(0, 4), parseInt(date.substring(4, 6)) - 1, date.substring(6, 8));
    let now = new Date();
    let isPastMonth = selectedDate.getFullYear() < now.getFullYear() || 
                     (selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() < now.getMonth());

    if (isPastMonth) {
        // Для прошлого месяца берем lastDayDate из cookie LAST_DAY_OF_MONTH
        lastDayDate = getCookie('LAST_DAY_OF_MONTH');
        if (!lastDayDate) {
            // Если в cookie нет, вычисляем последний день месяца
            let lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            lastDayDate = lastDay.format("yyyymmddHHMMss");
        }
        console.log('[getDataTabel] lastDayDate для прошлого месяца:', lastDayDate);
        
        // Для прошлого месяца используем текущую дату в date
        date = new Date().format("yyyymmddHHMMss");
        args[1] = date;
    } else {
        // Для текущего месяца lastDayDate — последний день месяца
        let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastDayDate = lastDay.format("yyyymmddHHMMss");
        console.log('[getDataTabel] lastDayDate для текущего месяца:', lastDayDate);
    }

    args.push(lastDayDate);
    args.push(update);

    // Проверяем куку FULL_READONLY только если не передан параметр fullReadonly
    let shouldAddFullReadonly = fullReadonly || window.IS_FULL_READONLY || getFullReadonlyCookie();
    args.push(shouldAddFullReadonly); 

    console.log('[getDataTabel] Итоговые параметры запроса:', args);
    let data = await getData(loader, hideAfter, "ПолучитьДанныеТабеля", args);
    console.log('Ответ сервера на ПолучитьДанныеТабеля:', data);
    TIMESTAMP_SESSION = Math.floor(Date.now() / 1000);
    TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
    if(data){
        if(!data.error && data.valid){
            if(Number(VER) < Number(data.result.ver)){
                sleep(5).then(() => {document.location.reload();});
            }
            DAYS = data.result.days;
            LOCATIONS = data.result.locations;
            DATA = data.result.data;
            
            // Если пришли данные и это автообновление, обновляем сохраненную дату
            if (update && data.result.data && data.result.data.length > 0) {
                setCookie('LAST_SUCCESSFUL_DATE', date, 365);
                console.log('[getDataTabel] Обновлена сохраненная дата:', date);
            }
            
            // Обработка поля readAll
            if ('readAll' in data.result) {
                $('#menu-fullreadonly').show();
            } else if (getReadAllCookie()) {
                $('#menu-fullreadonly').show();
            } else {
                $('#menu-fullreadonly').hide();
            }
            
            if(!window.organizations && data.result.organizations) {
                window.organizations = data.result.organizations;
                renderOrgFilter(window.organizations);
            }
            $("#loader").hide();
            if(DATA.length == 0) return;
            DATATIME = new Date().format("yyyymmddHHMMss");
            let pageX = window.pageXOffset;
            let pageY = window.pageYOffset;
            saveSelection();
            createHead();
            createTabel();
            restoreSelection();
            updateOrgFilterSelected();
            applyOrgFilter();
            forceShowUnassigned();
            restoreLastCellOrScroll();
            window.SAVED_DATA = DATA;
            initTooltips();
            if(window.organizations) applyOrgFilter();
        } else {
            console.log(data.des);
            $('#loader_dv').hide();
            $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
            $('#loader_des').append(data.des);
            $('#loader_des').show();
            SID = null;
            UID = null;
            LABEL = null;
            delAllCookie();
            document.location.href="/auth.htm";
        }
    } else {
        console.log(data.des);
        $('#loader_dv').hide();
        $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
        $('#loader_des').append(data.des);
        $('#loader_des').show();
        $('#loader').show();
    }
}

function createHead(){
	
	TODAY = -1;
	
	$('#head-days').empty();
	
	let headDays = '';
	for(let d in DAYS){

		let suffix = '';
		let title = '';
		if(DAYS[d]['today']){
			suffix = 'today';
			title = 'title="Сегодня"';
			
			TODAY = d;
		}else{
			suffix = DAYS[d]['weekend'] ? 'weekend' : 'work';
		}
		
		headDays += '<div id="0_'+Number(d)+'-day-dv" '+title+' class="head-day-'+suffix+'" onClick="selectCol('+Number(d)+')">';
		headDays += DAYS[d]['day'];
		headDays += '<div class="head-wday">'+wShortDays[DAYS[d]['dow']-1]+'</div>';
		headDays += '</div>';

	}
	
	$('#head-days').html(headDays);
	
	$('#menu-head').width($('#head').innerWidth()-10);

}

function createTabel(){
    console.log('[createTabel] Начало построения таблицы');
    WORKERS = [];
    TABEL = [];

    // Оптимизация: формируем фильтры блоками
    let filterFirmsHtml = '';
    let filterPostsHtml = '';
    let filterLocationsHtml = '';

    $('#filter-firms-dv').empty();
    $('#filter-posts-dv').empty();
    $('#filter-locations-dv').empty();
    
    $('#table').empty();
    
    let firm_uid       = [];
    let post_uid       = [];
    let location_uid   = [];
    
    let location_no    = 0;
    let chief_no       = 0;
    let master_no      = 0;
    let worker_no      = 0;
    
    let html = '<div style="width:'+$('#head').innerWidth()+'px;">';
    console.log('[createTabel] DATA:', DATA);
    for(let l in DATA){
        let location = DATA[l];
        console.log('[createTabel] Обработка локации:', location.name);
        location_no     = location_no+1;
        let location_id = location_no+'_'+location['uid'];
        let canvas      = {};
        canvas['id']    = 'l_'+location_id;
        canvas['state'] = "show";
        CANVASES.push(canvas);
        html += '<div id="l_'+location_id+'-head" class="location-head" data-location-idx="'+l+'" onclick="slideDiv(\'l\',\''+location_id+'\')">';
        html += '<div class="toggle-bt" onclick="slideDiv(\'l\',\''+location_id+'\')"></div>';
        html += '<span id="l_'+location_id+'-sp">'+location['name']+'</span>';
        html += '<div class="location-count-workers"><span id="l_'+location_id+'-empty-sp"></span></div>';
        html += '</div>';
        html += '<div id="l_'+location_id+'-canvas" style="width:'+$('#head').innerWidth()+'px;">';
        for(let c in location['chiefs']){
            let chief = location['chiefs'][c];
            console.log('[createTabel] Обработка начальника:', chief.name);
            chief_no       = chief_no+1;
            let chief_id   = chief_no+'_'+chief['uid'];
            let canvas      = {};
            canvas['id']    = 'c_'+chief_id;
            canvas['state'] = getCookie(canvas['id']);
            CANVASES.push(canvas);
            let chief_name = '';
            let notChief = chief['name'].match(/(\=|\#|\<|\>)/ig);
            if(notChief == null) chief_name = 'НАЧАЛЬНИК: ';
            html += '<div id="c_'+chief_id+'-head" class="chief-head" data-location-idx="'+l+'" data-chief-idx="'+c+'" onclick="slideDiv(\'c\',\''+chief_id+'\')">';
            html += '<div class="toggle-bt" onclick="slideDiv(\'c\',\''+chief_id+'\')"></div>';
            html += '<span id="c_'+chief_id+'-short-sp" class="chief-text-short">'+chief_name+chief['name']+'</span>';
            html += '<span id="c_'+chief_id+'-full-sp" class="chief-text-full">'+location['name']+' > '+chief_name+chief['name']+'</span>';
            html += '<div class="chief-count-workers"><span id="c_'+chief_id+'-empty-sp"></span></div>';
            html += '</div>';
            html += '<div id="c_'+chief_id+'-canvas" class="masters">';
            for(let m in chief['masters']){
                let master      = chief['masters'][m];
                console.log('[createTabel] Обработка мастера:', master.name);
                master_no      = master_no+1;
                let master_id  = master_no+'_'+master['uid'];
                Array.prototype.push.apply(WORKERS, master['workers']);
                let canvas      = {};
                canvas['id']    = 'm_'+master_id;
                canvas['state'] = getCookie(canvas['id']);
                CANVASES.push(canvas);
                let master_name = '';
                let notMaster = master['name'].match(/(\=|\#|\<|\>)/ig);
                if(notMaster == null) master_name = 'МАСТЕР: ';
                html += '<div id="m_'+master_id+'-head" class="master-head" data-location-idx="'+l+'" data-chief-idx="'+c+'" data-master-idx="'+m+'" onclick="slideDiv(\'m\',\''+master_id+'\')">';
                html += '<div class="toggle-bt" onclick="slideDiv(\'m\',\''+master_id+'\')"></div>';
                html += '<span id="m_'+master_id+'-short-sp" class="master-text-short">'+master_name+master['name']+'</span>';
                html += '<span id="m_'+master_id+'-full-sp" class="master-text-full">'+location['name']+' > НАЧАЛЬНИК: '+chief['name']+' > '+master_name+master['name']+'</span>';
                html += '<div class="master-count-workers"><span id="m_'+master_id+'-empty-sp"></span></div>';
                html += '</div>'; 
                html += '<div id="m_'+master_id+'-canvas" class="workers">';
                html += '<div class="items">';
                let htmlDays = '';
                let htmlSumDays = '';
                let htmlSumHours = '';
                for(let w in master['workers']){
                    let worker      = master['workers'][w];
                    console.log('[createTabel] Обработка работника:', worker.fio);
                    worker_no      = worker_no+1;
                    let worker_id  = worker_no+'_'+worker['uid'];
                    let notWorker  = worker['fio'].match(/(\=|\#|\<|\>)/ig);
                    if(typeof notWorker === 'object' && notWorker != null) {
                        console.log('[createTabel] Пропуск работника из-за специальных символов:', worker.fio);
                        continue;
                    }
                    TABEL[worker_id] = worker['days'];
                    if(!firm_uid.includes(worker['firm_uid'])){
                        firm_uid.push(worker['firm_uid']);
                        filterFirmsHtml += '<label><input type="checkbox" onClick="changeFilter(\'firm\')" checked="checked" name="'+worker['firm_uid']+'" />'+worker['firm_name']+'</label>';
                    }
                    if(!post_uid.includes(worker['post_uid'])){
                        post_uid.push(worker['post_uid']);
                        filterPostsHtml += '<label><input type="checkbox" onClick="changeFilter(\'post\')"  checked="checked" name="'+worker['post_uid']+'" />'+worker['post_name']+'</label>';
                    }
                    if(!location_uid.includes(worker['location_uid'])){
                        location_uid.push(worker['location_uid']);
                        filterLocationsHtml += '<label><input type="checkbox" onClick="changeFilter(\'location\')"  checked="checked" name="'+worker['location_uid']+'" />'+worker['location_name']+'</label>';
                    }
                    html += '<div id="'+worker_id+'-row" class="worker-row">';
                    html += '<div id="'+worker_no+'number-row" class="number-row">'+worker_no+'</div>';
                    // --- ИЗМЕНЕНО: Проверяем наличие кода "СО" перед блоком ФИО, но добавляем кнопку ВНУТРИ блока ФИО ---
                    let hasDO = worker.days.some(day => day && day.vt === 'СО');
                    // --- ИЗМЕНЕНО: Добавлен атрибут data-uid к worker_lb ---
                    html += '<div id="'+worker_id+'" data-uid="'+worker['uid']+'" onClick="selectRow('+(worker_no-1)+')" class="worker_lb">';
                    if (hasDO) {
                        // --- ИЗМЕНЕНО: Передаем worker['uid'] в showWorkerObjectsTabel ---
                        html += '<span class="show-info-plus" onclick="showWorkerObjectsTabel(\''+worker['uid']+'\', event)">+</span>';
                    }
                    html += '<span id="'+worker_id+'-sp">'+worker['fio']+'</span>';
                    html += '<div id="'+worker_id+'-info-dv" onClick="showHideInfo(this, \''+worker_id+'\')" class="info-row"></div>';
                    html += '</div>';
                    html += '</div>';
                    htmlDays+= '<div id="'+worker_id+'-dv" class="row-days-dv">';
                    let dateIn = worker['date_in'];
                    let normIn = '';
                    if(dateIn) {
                        normIn = parseDateIn(dateIn);
                    }
                    for(let d in DAYS){
                        let day = worker['days'][d];
                        let days_id = worker_no+'-'+(Number(d)+1);
                        let dayHours = "";
                        let dayValue = "";
                        if(day != undefined && day['vt'] != undefined){    
                            dayValue = day['vt'];
                            if(codesDi.includes(String(day['hours']))){
                                dayHours = day['hours'];
                            }
                        }
                        suffix = day['weekend'] ? 'weekend' : 'work';
                        opacity = '1';
                        let isFixed = day && day.fixState;
                        let cellClass = 'days-' + suffix;
                        if(normIn) {
                            let dayObj = DAYS[d];
                            let dayDate = '';
                            if(dayObj && dayObj['year'] && dayObj['month'] && dayObj['day']) {
                                dayDate = String(dayObj['year']) + ('0'+dayObj['month']).slice(-2) + ('0'+dayObj['day']).slice(-2);
                            }
                            let normDay = String(dayDate);
                            if(Number(normDay) < Number(normIn) && (!dayHours || dayHours == 0)) {
                                cellClass += ' cell-before-in';
                            }
                        }
                        if (isFixed) cellClass += ' cell-fixed';
                        let docAttr = '';
                        if (isFixed && day && day['doc']) {
                            docAttr = ' data-doc="'+String(day['doc']).replace(/"/g, '&quot;')+'"';
                        }
                        let hoursNum = Number(dayHours);
                        let htmlCell = '';
                        // --- Оптимизация: сразу добавляем класс cell-attendance-missing-hours и стили, если нужно ---
                        let extraClass = '';
                        let extraStyle = '';
                        let col_no = Number(d)+1;
                        let isToday = (typeof TODAY !== 'undefined' && col_no < Number(TODAY)+1);
                        if(isToday) {
                            if((!dayValue || dayValue === "") && (!hoursNum || hoursNum == 0)){
                                extraClass = ' cell-attendance-missing-hours';
                                extraStyle = 'color:'+YaFnt+';font-weight:bold;';
                            }else if(dayValue === "Я" && (!hoursNum || hoursNum == 0)){
                                extraClass = ' cell-attendance-missing-hours';
                                extraStyle = 'color:'+YaFnt+';font-weight:bold;';
                            }else{
                                extraStyle = 'color:'+selectedFnt+';font-weight:normal;';
                            }
                        } else {
                            extraStyle = 'color:'+selectedFnt+';font-weight:normal;';
                        }
                        if(dayValue && !hoursNum){
                            htmlCell = '<span class="cell-code-big">'+dayValue+'</span>';
                            htmlCell += '<div id="'+days_id+'-day-hours" class="days-hours"></div>';
                        }else if(dayValue && hoursNum){
                            htmlCell = '<span class="cell-code-small">'+dayValue+'</span><span class="cell-hours-big">'+hoursNum+'</span>';
                        }else if(hoursNum) {
                            htmlCell = '<span class="cell-hours-big">'+hoursNum+'</span>';
                        }else{
                            htmlCell = '';
                            htmlCell += '<div id="'+days_id+'-day-hours" class="days-hours"></div>';
                        }
                        htmlCell += '<div id="'+days_id+'-day-comment" class="days-comment" style="display: '+(day['comment'] != '' ? 'block' : 'none')+';"></div>';
                        htmlDays += '<div id="'+days_id+'-day-dv" class="'+cellClass+extraClass+'" '+docAttr+' '+(isFixed ? ' data-fixed="1"' : '')+' style="opacity:'+opacity+';'+extraStyle+'" title="'+day['comment']+'" onMouseDown="console.log(\'[LOG] onmousedown\', this);startSelect('+(worker_no-1)+','+Number(d)+', event)" onMouseMove="endSelect('+(worker_no-1)+','+Number(d)+')" onMouseOver="overCell(\''+worker_no+'\','+Number(w)+','+Number(d)+')" onMouseOut="outCell(\''+worker_no+'\','+Number(w)+','+Number(d)+')" onContextMenu="onRightClick()" ondblclick="onDoubleClick()">'+htmlCell+'</div>';
                    }
                    htmlDays += '</div>';
                    htmlSumDays += '<div id="'+worker_id+'-days-dv" class="row-sum-days-dv"></div>';
                    htmlSumHours+= '<div id="'+worker_id+'-hours-dv" class="row-sum-hours-dv"></div>';
                }
                html += '</div>';
                html += '<div id="field">';
                html += htmlDays;
                html += '</div>';
                html += '<div id="sum-days-dv">';
                html += htmlSumDays;
                html += '</div>';
                html += '<div id="sum-hours-dv">';
                html += htmlSumHours;
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    $('#filter-firms-dv').html(filterFirmsHtml);
    $('#filter-posts-dv').html(filterPostsHtml);
    $('#filter-locations-dv').html(filterLocationsHtml);
    $('#table').html(html);
    for(index in CANVASES){
        let canvas = CANVASES[index];
        if(canvas['state'] == "show" || master_no == 1){
            $('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
            $('#'+canvas['id']+'-canvas').show();
        }else{
            $('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/down.png")');
            $('#'+canvas['id']+'-canvas').hide();
        }
    }
    calcDays();
}

// ACTION ===========================

// Функция для показа уведомления о потере соединения
function showConnectionError(message = "Потеряно соединение с сервером! Изменения не сохранены.") {
    if ($('#connection-error-notify').length === 0) {
        $('body').append('<div id="connection-error-notify" style="position:fixed;top:30px;right:30px;z-index:99999;background:#ffdddd;border:1px solid #c00;padding:15px 25px;border-radius:8px;box-shadow:0 2px 8px #0002;font-size:18px;display:none;"></div>');
    }
    $('#connection-error-notify').text(message).fadeIn(200);
    setTimeout(() => { $('#connection-error-notify').fadeOut(500); }, 5000);
}

async function sendDataTabel(full=true){
    let items  = [];
    let arr_in = full ? TABEL : QUEUE.shift(); // Обрабатываем очередь или полный табель

    // === ДОБАВЛЕНО: Если не полный режим (full=false), добавляем также изменения из changedCells ===
    let currentChanged = {};
    if (!full && Object.keys(changedCells).length > 0) {
        // Копируем changedCells и затем очищаем его
        currentChanged = changedCells;
        changedCells = {}; // Очищаем changedCells сразу после копирования
        console.log('[sendDataTabel] Добавлены изменения из changedCells для отправки:', JSON.stringify(currentChanged, null, 2));
        // Объединяем текущую очередь (если есть) и changedCells для отправки
        if (arr_in) { // arr_in будет объектом, если QUEUE.shift() вернул что-то
            arr_in = {...arr_in, ...currentChanged};
        } else { // QUEUE была пуста, отправляем только changedCells
            arr_in = currentChanged;
        }
         console.log('[sendDataTabel] Общий объект для отправки (arr_in):', JSON.stringify(arr_in, null, 2));
    }

    for(let key in arr_in){
        let id_arr  = key.split('_');
        let no      = Number(id_arr[0]);
        let uid     = id_arr[1];
        let item            = {};
        item['uid']         = uid;
        // Находим работника, чтобы получить master_uid. Более надежный способ, чем workers[no-1]
        let worker = WORKERS.find(w => w.uid === uid);
        item['master_uid']  = worker ? worker.master_uid : null;
        if (item['master_uid'] === null) {
             console.warn('[sendDataTabel] Не найден master_uid для worker uid:', uid);
        }

        item['tabel'] = [];
        // arr_in[key] здесь - это объект, где ключи - индексы дней, а значения - объекты дня {vt, hours, ...}
        // Нужно преобразовать его в массив объектов дней, отсортированный по индексу дня
        let daysArray = Object.keys(arr_in[key]).sort((a, b) => Number(a) - Number(b)).map(dayIndex => {
             // Добавляем информацию о дне (год, месяц, день) из глобального массива DAYS
             let dayInfo = DAYS[Number(dayIndex)];
             return {
                ...arr_in[key][dayIndex],
                comment: arr_in[key][dayIndex].comment || "", // <-- добавлено!
                year: dayInfo ? dayInfo.year : null,
                month: dayInfo ? dayInfo.month : null,
                day: dayInfo ? dayInfo.day : null
            };
        });
        item['tabel'] = daysArray;
        items.push(item);
    }
    // Логируем отправляемые данные
    console.log('Отправка данных на сервер 1С:', JSON.stringify(items, null, 2));
    if(items.length == 0) {
        console.log('Нет данных для отправки.');
        $('#loader').hide(); // Если лоадер был показан для этой отправки
        if (!full && QUEUE.length > 0) {
             // Если отправляли очередь, и в ней еще что-то есть (но не было changedCells),
             // возможно, нужно вызвать sendDataTabel(false) снова для следующего элемента очереди.
             // Но текущая логика QUEUE.shift() уже взяла элемент из очереди.
             // Если QUEUE пуста, ничего не делаем.
        }
        return; // Выходим, если нет items для отправки
    }
    let data;
    try {
        // Передаем items в массиве, как ожидается сервером
        data = await getData(full, !full, "ЗаписатьЗначенияТабеля", [UID, DATATIME, items]);
    } catch (e) {
        showConnectionError("Ошибка соединения с сервером при отправке табеля! Попробуйте позже.");
        // === ДОБАВЛЕНО: Если отправка changedCells не удалась, нужно вернуть их обратно! ===
         if (!full && Object.keys(currentChanged).length > 0) {
             // Если changedCells были очищены и отправка не удалась, возвращаем их в changedCells.
             // Это может привести к дублированию в QUEUE, если unselectCells() сработал,
             // но более безопасно, чем потерять изменения. Лучше продумать более сложную логику
             // с очередью повторной отправки. Пока просто добавляем обратно.
             // Более безопасный способ: добавить обратно в QUEUE начало
             QUEUE.unshift(currentChanged);
             console.warn('[sendDataTabel] Ошибка отправки changedCells, возвращено в QUEUE:', JSON.stringify(currentChanged, null, 2));
         }
        return; // Прерываем выполнение при ошибке
    }
    // Логируем ответ сервера
    console.log('Ответ сервера 1С:', data);
    if(!data || data.error || !data.valid) {
        showConnectionError("Изменения табеля не сохранены! Проверьте соединение с сервером или обратитесь к администратору.");
        $('#loader_dv').hide();
        $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
        $('#loader_des').append(data && data.des ? data.des : "Нет ответа от сервера");
        $('#loader_des').show();
        // $('#loader').show(); // Не показываем полный лоадер при ошибке частичной отправки

        console.log(data && data.des ? data.des : "Нет ответа от сервера");

        // === ДОБАВЛЕНО: Если отправка changedCells не удалась (valid=false), нужно вернуть их обратно! ===
        if (!full && Object.keys(currentChanged).length > 0) {
             QUEUE.unshift(currentChanged);
             console.warn('[sendDataTabel] Сервер вернул ошибку для changedCells, возвращено в QUEUE:', JSON.stringify(currentChanged, null, 2));
        }

        return; // Прерываем выполнение при ошибке
    }

    // === ДОБАВЛЕНО: Если отправка changedCells успешна (!full && currentChanged), очистка уже произошла выше ===

    if(full){
        if(!data.error && data.valid){
            getDataTabel(false, false, UID, date, lastDayDate,  true);  // Полное обновление после полной отправки
        }
        // Ошибки уже обработаны выше
    }else{ // Частичная отправка (changedCells или элемент из QUEUE)
        if(!data.error && data.valid){
            $('#loader').hide(); // Если лоадер был показан для этой частичной отправки
            TIMESTAMP_SESSION 	= Math.floor(Date.now() / 1000);
            TIMESTAMP_ACTIVITY 	= Math.floor(Date.now() / 1000);

            // === ДОБАВЛЕНО: После успешной частичной отправки, если QUEUE не пуста, отправляем следующий элемент ===
             if(QUEUE.length > 0) {
                 console.log('[sendDataTabel] Очередь не пуста, отправляю следующий элемент.');
                 sendDataTabel(false);
             } else {
                  console.log('[sendDataTabel] Очередь пуста, частичная отправка завершена.');
             }

        }
        // Ошибки уже обработаны выше
    }
}

async function changeData(...args){
	
	let full = false;
	let method = args.shift();
	
	args.unshift(UID);
	
	let data = await getData(full, !full, method, args);
	
	if(!data.error && data.valid){
		document.location.reload();
	}else{
		console.log(data.des);
		
		$('#loader_dv').hide();
		$('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
		$('#loader_des').append(data.des);
		$('#loader_des').show();
		$('#loader').show();
	}
}

function toPage(chapter=""){
	
	switch(chapter){
		default:
		case "menu":
			document.location.href = "/";
			break;
		case "exit":
			SID = null;
			UID = null;	
			LABEL = null;
				
			delAllCookie();
				
			document.location.href="/auth.htm";

			break;
	}
	
}

let changedCells = {};
function setCells(value, isComment=false, isFullClear=false){
    if (selectedCells.length > 1 && isColSelection()) {
        return;
    }
    console.log('[DEBUG] setCells вызван', value, selectedCells);

    const allowedFutureCodes = ["Б", "ОТ", "ОД", "У", "Р", "ОЖ", "ОБ", "ПК", "ДО", "УВ"];
    let matches = value.match(/^[0-9]+$/);
    let isCurrentMonth = curDate.getFullYear() === new Date().getFullYear() && curDate.getMonth() === new Date().getMonth();

    for(let key in selectedCells){
        let changed = false;
        let cell = selectedCells[key];
        let uid = WORKERS[Number(cell['row'])]['uid'];
        let day = Number(cell['col']);
        let no = Number(cell['row'])+1;
        let id = no+'_'+uid;

        // Проверка enable только для текущего месяца
        if (isCurrentMonth && WORKERS[Number(cell['row'])]['days'][cell['col']]['enable'] === false) {
            console.log('[DEBUG] return: enable==false', {cell, value, isCurrentMonth});
            continue;
        }
        if(isCurrentMonth && TODAY == -1) {
            console.log('[DEBUG] return: TODAY==-1', {cell, value, isCurrentMonth});
            continue;
        }
        // Разрешаем установку специальных кодов для будущих дней
        if (
            isCurrentMonth &&
            Number(cell['col']) > TODAY &&
            !isComment && !isFullClear
        ) {
            if (
                value === "" // разрешаем очистку
            ) {
                // разрешаем очистку, ничего не делаем
            } else if (
                matches != null || // Число
                (typeof value === "string" && !allowedFutureCodes.includes(value.trim().toUpperCase()))
            ) {
                console.log('[DEBUG] return: future day, not allowed code', {cell, value, isCurrentMonth, TODAY});
                continue;
            }
            // Если value разрешён — пропускаем дальше!
        }

        // --- Комментарии и очистка ---
        if(isComment || isFullClear){
            if (isComment) {
                TABEL[id][day]['comment'] = value;
                if (!changedCells[id]) changedCells[id] = {};
                changedCells[id][day] = TABEL[id][day];
                TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
                sendDataTabel(false);
            
                // --- Полное обновление DOM ячейки ---
                let htmlValue = '';
                let dayValue = TABEL[id][day]['vt'];
                let hoursNum = TABEL[id][day]['hours'];
                if(dayValue && !hoursNum){
                    htmlValue = `<span class="cell-code-big">${dayValue}</span>`;
                } else if(dayValue && hoursNum) {
                    htmlValue = `<span class="cell-code-small">${dayValue}</span><span class="cell-hours-big">${hoursNum}</span>`;
                } else {
                    htmlValue = '';
                }
                htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment" class="days-comment" title="'+value+'" style="display:'+(value ? 'block' : 'none')+';"></div>';
                if(hoursNum == 0) {
                    htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-hours" class="days-hours"></div>';
                }
                $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html(htmlValue);
            }
            if ((/^[0-9]+$/.test(value) && value !== "") || value === "" || value === 0) {
                let hoursVal = value === "" ? 0 : Number(value);
                TABEL[id][day]['hours'] = hoursVal;
                if (value === "" || value === 0) {
                    TABEL[id][day]['vt'] = ""; // <--- СБРАСЫВАЕМ КОД!
                }
                if (!changedCells[id]) changedCells[id] = {};
                changedCells[id][day] = TABEL[id][day];
                TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
                // Обновляем отображение
                let htmlValue = '';
                let dayValue = TABEL[id][day]['vt'];
                let hoursNum = hoursVal;
                if(dayValue && !hoursNum){
                    htmlValue = `<span class="cell-code-big">${dayValue}</span>`;
                } else if(dayValue && hoursNum) {
                    htmlValue = `<span class="cell-code-small">${dayValue}</span><span class="cell-hours-big">${hoursNum}</span>`;
                } else {
                    htmlValue = '';
                }
                htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment" class="days-comment" title="'+TABEL[id][day]['comment']+'"></div>';
                if(hoursNum == 0) {
                    htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-hours" class="days-hours"></div>';
                }
                $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html(htmlValue);
                if(dayValue === "Я" && (!hoursNum || hoursNum == 0)){
                    $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": YaFnt, "font-weight": "bold"});
                }else{
                    $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": selectedFnt, "font-weight": "normal"});
                }
                continue;
            } else {
                // Не часы и не пусто — ничего не делаем
                continue;
            }
        }

        // --- Основная логика установки кода ---
        let htmlValue = '';
        let dayHours = '';
        let dayValue = String(TABEL[id][day]['vt']);
        if(codesDi.includes(value)){
            dayValue = dayValue == '' ? 'Я' : dayValue;
            dayHours = dayValue != '' ?  Number(value) : 0;
        }else{
            dayValue = Number(value) != 0 || value == '' ? value : "Я";
            dayHours = "";
        }
        if(TABEL[id][day]['vt'] != dayValue ||  Number(TABEL[id][day]['hours']) != Number(dayHours)) {
            changed = true;
        }
        TABEL[id][day]['vt']  = dayValue;
        TABEL[id][day]['hours'] = dayHours == "" ? 0 : dayHours;
        // ЛОГ после изменения данных
        console.log('[DEBUG] После изменения TABEL', {id, day, vt: TABEL[id][day]['vt'], hours: TABEL[id][day]['hours']});
        // Формируем красивый html
        let hoursNum = Number(dayHours);
        if(dayValue && !hoursNum){
            htmlValue = `<span class="cell-code-big">${dayValue}</span>`;
        } else if(dayValue && hoursNum) {
            htmlValue = `<span class="cell-code-small">${dayValue}</span><span class="cell-hours-big">${hoursNum}</span>`;
        } else {
            htmlValue = '';
        }
        htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment" class="days-comment" title="'+TABEL[id][day]['comment']+'"></div>';
        if(hoursNum == 0) {
            htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-hours" class="days-hours"></div>';
        }
        $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html(htmlValue);
        // ЛОГ после изменения DOM
        console.log('[DEBUG] После изменения DOM', $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html());
        if(dayValue === "Я" && (!dayHours || dayHours == 0)){
            $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": YaFnt, "font-weight": "bold"});
        }else{
            $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": selectedFnt, "font-weight": "normal"});
        }
        if(TABEL[id][day]['comment'] != ''){
            $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment').show();
        }else{
            $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment').hide();
        }

        if(changed){
            if (!changedCells[id]) changedCells[id] = {};
            changedCells[id][day] = TABEL[id][day];
            TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
        }

        let col = Number(cell['col'])+1;
        let $cell = $('#'+no+'-'+col+'-day-dv');
        $cell.removeClass('cell-attendance-missing-hours');
        if (col < Number(TODAY)+1) {
            let val = TABEL[id][day]['vt'];
            let hours = TABEL[id][day]['hours'];
            if ((!val || val === "") && (!hours || hours == 0)) {
                $cell.addClass('cell-attendance-missing-hours');
                $cell.css({"color": YaFnt, "font-weight": "bold"});
            } else if (val === "Я" && (!hours || hours == 0)) {
                $cell.addClass('cell-attendance-missing-hours');
                $cell.css({"color": YaFnt, "font-weight": "bold"});
            } else {
                $cell.css({"color": selectedFnt, "font-weight": "normal"});
            }
        } else {
            $cell.css({"color": selectedFnt, "font-weight": "normal"});
        }
    }
}

function getCellValue(indexRow, indexCol){
	
	for(let key in selectedCells){
	
		let cell = selectedCells[key];
		
		if(indexRow == cell['row'] && indexCol == cell['col']){
			
			let uid = WORKERS[Number(cell['row'])]['uid'];
			let day = Number(cell['col']);
			let no 	= Number(cell['row'])+1;
			let id 	= no+'_'+uid;
			
			return TABEL[id][day];
		}
		
	}
	
	return null;
}

function setComment(clear=false){
    if(selectedCells.length === 0 && lastSelectedCellForComment && lastSelectedCellForComment.length > 0) {
        selectedCells = JSON.parse(JSON.stringify(lastSelectedCellForComment));
    }
    console.log('[DEBUG] setComment', selectedCells);
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        let $cell = $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv');
        // Если ячейка фиксирована, разрешаем только комментарий
        if ($cell.hasClass('cell-fixed') || $cell.attr('data-fixed') == '1') {
            // Разрешаем только комментарий
        }
    }
	if(clear){
		setCells("", true);
	}else{
		setCells($('#add-comment-in').val(), true);
	}
	
	$('#add-comment-in').val("");
	$('#add-comment-dv').removeClass('show');
	
	settingComment = false;
    lastSelectedCellForComment = null;
	
}

function calcDays(){
    let emptyDays = {};
    let allWorkers = {};
    let daysArr = [];
    let hoursArr = [];
    let masterMap = {};
    let chiefMap = {};
    let locationMap = {};

    // Сначала собираем все значения в массивы и строим маппинги
    for(let w in WORKERS){
        let days = 0, hours = 0;
        let row_no = Number(w)+1;
        let id = row_no+'_'+WORKERS[w]['uid'];
        let master_id = String($('#'+id+'-row').parent().parent().attr('id')).replace('-canvas', '');
        let chief_id = String($('#'+id+'-row').parent().parent().parent().attr('id')).replace('-canvas', '');
        let location_id = String($('#'+id+'-row').parent().parent().parent().parent().attr('id')).replace('-canvas', '');
        if (!masterMap[master_id]) masterMap[master_id] = [];
        if (!chiefMap[chief_id]) chiefMap[chief_id] = [];
        if (!locationMap[location_id]) locationMap[location_id] = [];
        masterMap[master_id].push(WORKERS[w]);
        chiefMap[chief_id].push(WORKERS[w]);
        locationMap[location_id].push(WORKERS[w]);
        for(let d in DAYS){
            let col_no = Number(d)+1;
            let $cell = $('#'+row_no+'-'+col_no+'-day-dv');
            let text = $cell.text();
            if(text != ""){
                let htmlDays = text.match(/(\d|Я|К)/igu);
                if(htmlDays != null) days++;
                hours += Number(text.replace(/[^0-9]/igu, 0));
            }
        }
        daysArr[w] = days;
        hoursArr[w] = hours;
    }

    // Потом одним циклом обновляем DOM
    for(let w in WORKERS){
        let row_no = Number(w)+1;
        let id = row_no+'_'+WORKERS[w]['uid'];
        let $days = $('#'+id+'-days-dv');
        let $hours = $('#'+id+'-hours-dv');
        if ($days.text() != daysArr[w]) {
            if(daysArr[w] > 0) $days.html(daysArr[w]);
            else $days.empty();
        }
        if ($hours.text() != hoursArr[w]) {
            if(hoursArr[w] > 0) $hours.html(hoursArr[w]);
            else $hours.empty();
        }
    }

    // --- Новая функция подсчёта, как в тултипе ---
    function tooltipStats(workersArr) {
        let todayIndex = TODAY;
        let countY = 0;
        let countB = 0;
        let countEmpty = 0;
        let detailedNotPresentCounts = {'НН': 0, 'НВ': 0, 'Г': 0, 'МО': 0};
        let detailedAbsentCounts = {'ОТ': 0, 'ОД': 0, 'У': 0, 'ОБ': 0, 'ПК': 0, 'Д': 0, 'СО': 0, 'УВ': 0, 'Р': 0, 'ОЖ': 0, 'ДО': 0, 'В': 0, 'К': 0, 'ПЧ':0};
        let totalWorkers = 0;
        for(let i=0;i<workersArr.length;i++){
            let worker = workersArr[i];
            if (
                !worker ||
                !worker.uid ||
                !worker.fio ||
                typeof worker.fio !== 'string' ||
                worker.fio.trim().startsWith('‹')
            ) {
                // Невалидный сотрудник — пропускаем
                continue;
            }
            totalWorkers++;
            if (
                !worker.days ||
                !Array.isArray(worker.days) ||
                worker.days.length <= todayIndex ||
                !worker.days[todayIndex] ||
                typeof worker.days[todayIndex] !== 'object'
            ) {
                countEmpty++;
                continue;
            }
            let dayObj = worker.days[todayIndex];
            let vt = (dayObj && 'vt' in dayObj) ? String(dayObj.vt).toUpperCase() : '';
            let hours = (dayObj && 'hours' in dayObj) ? Number(dayObj.hours) : 0;
            if (
                (!('vt' in dayObj) && !('hours' in dayObj)) ||
                (vt === '' && hours === 0)
            ) {
                countEmpty++;
                continue;
            }
            if (vt === 'Я') {
                countY++;
            } else if (vt === 'Б') {
                countB++;
            } else if (detailedNotPresentCounts.hasOwnProperty(vt)) {
                detailedNotPresentCounts[vt]++;
            } else if (detailedAbsentCounts.hasOwnProperty(vt)) {
                detailedAbsentCounts[vt]++;
            } else if (vt === '') {
                countEmpty++;
            }
        }
        let sumNotPresent = countB + detailedNotPresentCounts['НВ'] + detailedNotPresentCounts['Г'] + detailedNotPresentCounts['МО'];
        let sumAbsent = 0;
        for (const code in detailedAbsentCounts) {
            sumAbsent += detailedAbsentCounts[code];
        }
        let onObject = totalWorkers - sumAbsent;
        return {countEmpty, onObject, sumAbsent};
    }
    // Мастера
    for(let id in masterMap){
        let stats = tooltipStats(masterMap[id]);
        let text = 'Пустых: ' + stats.countEmpty + ' из (' + stats.onObject + ' + ' + stats.sumAbsent + ')';
        let $empty = $('#'+id+'-empty-sp');
        if ($empty.text() !== text) $empty.html(text);
    }
    // Начальники
    for(let id in chiefMap){
        let stats = tooltipStats(chiefMap[id]);
        let text = 'Пустых: ' + stats.countEmpty + ' из (' + stats.onObject + ' + ' + stats.sumAbsent + ')';
        let $empty = $('#'+id+'-empty-sp');
        if ($empty.text() !== text) $empty.html(text);
    }
    // Локации
    for(let id in locationMap){
        let stats = tooltipStats(locationMap[id]);
        let text = 'Пустых: ' + stats.countEmpty + ' из (' + stats.onObject + ' + ' + stats.sumAbsent + ')';
        let $empty = $('#'+id+'-empty-sp');
        if ($empty.text() !== text) $empty.html(text);
    }
}

function unselectCells(){
    console.log('[LOG] unselectCells()', {selectedCells: JSON.parse(JSON.stringify(selectedCells))});
	if(Object.keys(changedCells).length > 0){
		QUEUE.push(changedCells);
		changedCells = {};
		if(QUEUE.length > 0) sendDataTabel(false);
	}
	for(let key in selectedCells){
		let cell = selectedCells[key];
		if(!cell) continue;
		let idCell = '#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv';
		let today = false;
		let weekend = false;
		if($(idCell).attr('class')) weekend = Boolean($(idCell).attr('class').match(/weekend/iu));
		if($('#0_'+Number(cell['col'])+'-day-dv').attr('class')) today = Boolean($('#0_'+Number(cell['col'])+'-day-dv').attr('class').match(/today/iu));
		if(weekend){
			$(idCell).css("background", weekendBgd);
			$('#'+Number(cell['row']+1)+'number-row').css("background", unselectedNoBgd);
			if(today){
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", todayBgd);
			}else{
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", weekendBgd);
			}
		}else{
			$(idCell).css("background", unselectedBgd);
			$('#'+Number(cell['row']+1)+'number-row').css("background", unselectedNoBgd);
			if(today){
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", todayBgd);
			}else{
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", unselectedBgd);
			}
		}
		$(idCell).css("color", unselectedFnt);
		
	}
	selectedCells = [];
	$("#context-menu").hide(50);
	$("#cell-menu").hide(50);
	$('#history-menu').hide(50);
	saveScrollCellToCookie();
	saveLastCellToStorage();
}

let curRow = -1;
let curCol = -1;
function selectCell(indexRow, indexCol, event) {
    lastColSelectionByHeader = false;
    if (event === null) {
        console.trace('[TRACE] selectCell вызван с null');
    }
    console.log('[LOG] selectCell вызван', {indexRow, indexCol, event, ctrl: event && event.ctrlKey, shift: event && event.shiftKey, selectedCells: JSON.parse(JSON.stringify(selectedCells))});
    // Если уже выделена эта ячейка и выделено больше одной — не сбрасываем выделение
    if (!(event && event.shiftKey) && selectedCells.length > 1) {
        for (let cell of selectedCells) {
            if (cell.row === indexRow && cell.col === indexCol) {
                return;
            }
        }
    }
    showHideInfo(null,null);
    curRow = indexRow;
    curCol = indexCol;
    
    // Сброс выделения только при обычном клике мышью (без Ctrl/Shift/Meta)
    if (
        event &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
    ) {
        console.log('[LOG] unselectCells вызван из selectCell', {indexRow, indexCol, event});
        unselectCells();
    }
    // если event === null — ничего не делаем!

    // Ctrl-выделение
    if (event && (event.ctrlKey || event.metaKey)) {
        // Проверяем, выделена ли уже эта ячейка
        let foundIdx = -1;
        for (let i = 0; i < selectedCells.length; i++) {
            let cell = selectedCells[i];
            if (cell.row === indexRow && cell.col === indexCol) {
                foundIdx = i;
                break;
            }
        }
        if (foundIdx !== -1) {
            // Уже выделена — снимаем выделение
            selectedCells.splice(foundIdx, 1);
            $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("background", unselectedBgd);
            $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("color", unselectedFnt);
            $('#'+Number(indexRow+1)+'number-row').css("background", unselectedNoBgd);
            $('#0_'+Number(indexCol)+'-day-dv').css("background", unselectedBgd);
        } else {
            // Не выделена — добавляем
            let cell = {};
            cell['row'] = indexRow;
            cell['col'] = indexCol;
            selectedCells.push(cell);
            $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("background", selectedBgd);
            $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
            $('#'+Number(indexRow+1)+'number-row').css("background", selectedBgd);
            $('#0_'+Number(indexCol)+'-day-dv').css("background", selectedBgd);
        }
        requestAnimationFrame(() => {
            if (typeof calcDays === 'function') calcDays();
        });
        return;
    }

    // Обычное выделение
    let cell = {};
    cell['row'] = indexRow;
    cell['col'] = indexCol;
    selectedCells.push(cell);
    $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("background", selectedBgd);
    $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
    $('#'+Number(indexRow+1)+'number-row').css("background", selectedBgd);
    $('#0_'+Number(indexCol)+'-day-dv').css("background", selectedBgd);
    saveScrollCellToCookie();
    saveLastCellToStorage();
    requestAnimationFrame(() => {
        if (typeof calcDays === 'function') calcDays();
    });
}
let startRow = -1;
let startCol = -1;
function startSelect(indexRow, indexCol, event){
    lastColSelectionByHeader = false;
    let $objectsModal = $('#worker-objects-modal');
    if ($objectsModal.is(':visible')) {
        console.log('[startSelect] Модальное окно объектов видимо, принудительно скрываем его.');
        closeWorkerObjectsModal();
    }
    if (window.IS_FULL_READONLY) return;
    let $cell = $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv');
    if (
        $cell.hasClass('cell-fixed') ||
        $cell.attr('data-fixed') == '1' ||
        $cell.hasClass('cell-before-in') ||
        isCellLocked(indexRow, indexCol)
    ) return;
    if ((event && event.shiftKey) && selectedCells.length === 1) {
        let start = selectedCells[0];
        let minRow = Math.min(start.row, indexRow);
        let maxRow = Math.max(start.row, indexRow);
        let minCol = Math.min(start.col, indexCol);
        let maxCol = Math.max(start.col, indexCol);
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                let $cell2 = $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv');
                if (
                    isCellLocked(row, col) ||
                    $cell2.hasClass('cell-fixed') ||
                    $cell2.attr('data-fixed') == '1' ||
                    $cell2.hasClass('cell-before-in')
                ) return;
            }
        }
        selectRectangle(start.row, start.col, indexRow, indexCol);
        startRow = start.row;
        startCol = start.col;
        curRow = indexRow;
        curCol = indexCol;
        return;
    }
    selectCell(indexRow, indexCol, event);
    startRow = indexRow;
    startCol = indexCol;
}

function endSelect(indexRow, indexCol){
    // Запрет выделения в режиме полного просмотра
    if (window.IS_FULL_READONLY) return;
    if(!mouseDown || isRightMB) return;
    // Проверка: если в диапазоне есть запрещённые ячейки — не выделять
    let minRow = Math.min(startRow, indexRow);
    let maxRow = Math.max(startRow, indexRow);
    let minCol = Math.min(startCol, indexCol);
    let maxCol = Math.max(startCol, indexCol);
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            let $cell2 = $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv');
            if (
                isCellLocked(row, col) ||
                $cell2.hasClass('cell-fixed') ||
                $cell2.attr('data-fixed') == '1' ||
                $cell2.hasClass('cell-before-in')
            ) return;
        }
    }
    unselectCells();
    let rows = [];
    if(startRow > indexRow){
        for(let i = startRow; i >= indexRow; i--){
            if(!rows.includes(i)) rows.push(i);
        }
    }else{
        for(let i = startRow; i <= indexRow; i++){
            if(!rows.includes(i)) rows.push(i);
        }
    }
    let cols = [];
    if(startCol > indexCol){
        for(let i = startCol; i >= indexCol; i--){
            if(!cols.includes(i)) cols.push(i);
        }
    }else{
        for(let i = startCol; i <= indexCol; i++){
            if(!cols.includes(i)) cols.push(i);
        }
    }
    rows.forEach((row) => {
        cols.forEach((col) => {
            let cell   = {};
            cell['row'] = row;
            cell['col'] = col;
            selectedCells.push(cell);
            $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css('background', selectedBgd);
            $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css('color', selectedFnt);
            $('#'+Number(row+1)+'number-row').css('background', selectedBgd);
            $('#0_'+Number(col)+'-day-dv').css('background', selectedBgd);
        });
    });
}

function selectRow(indexRow){
    unselectCells();
    let hasVisible = false;
    for(let j in DAYS){    
        let col_no = Number(j)+1;
        let $cell = $('#'+Number(indexRow+1)+'-'+col_no+'-day-dv');
        if ($cell.is(':visible')) {
            hasVisible = true;
            break;
        }
    }
    if (!hasVisible) return; // Нет видимых ячеек — не выделяем

    for(let j in DAYS){
        let col_no = Number(j)+1;
        let $cell = $('#'+Number(indexRow+1)+'-'+col_no+'-day-dv');
        if (!$cell.is(':visible')) continue;
        if (isCellLocked(indexRow, Number(j))) continue; // Запрет выделения lock-ячейки
        let cell  = {};
        cell['row'] = indexRow;
        cell['col'] = Number(j);
        selectedCells.push(cell);
        $cell.css("background", selectedBgd);
        $cell.css("color", selectedFnt);
    }
    saveScrollCellToCookie();
    saveLastCellToStorage();
}
let lastColSelectionByHeader = false;

function selectCol(indexCol){
    lastColSelectionByHeader = true; // Флаг для отслеживания выделения по заголовку
	unselectCells();
	let hasVisible = false;
	for(let i in WORKERS){
		let row_no = Number(i)+1;
		let $cell = $('#'+row_no+'-'+Number(indexCol+1)+'-day-dv');
		if ($cell.is(':visible')) {
			hasVisible = true;
			break;
		}
	}
	if (!hasVisible) return; // Нет видимых ячеек — не выделяем

	for(let i in WORKERS){
		let row_no = Number(i)+1;
		let $cell = $('#'+row_no+'-'+Number(indexCol+1)+'-day-dv');
		if (!$cell.is(':visible')) continue;
		let cell  = {};
		cell['row'] = Number(i);
		cell['col'] = indexCol;
		selectedCells.push(cell);
		$cell.css("background", selectedBgd);
		$cell.css("color", selectedFnt);
	}
	saveScrollCellToCookie();
	saveLastCellToStorage();
}

function overCell(worker_no, indexRow, indexCol){
	
	$('#'+worker_no+'number-row').css({opacity: .5});
	$('#0_'+indexCol+'-day-dv').css({opacity: .5});
	//$('#'+row_no+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
	
}

function outCell(worker_no, indexRow, indexCol){
	
	$('#'+worker_no+'number-row').css({opacity: 1});
	$('#0_'+indexCol+'-day-dv').css({opacity: 1});
	//$('#'+row_no+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
	
}

let settingComment = false;
function contextAction(act){
	let X, Y; // Объявляем переменные один раз в начале функции
	switch(act){
		default:
			break;
		case "history":
			let worker_uid = null;
			let historyDay = -1;
			for(let key in selectedCells){
				let cell = selectedCells[key];
				worker_uid = WORKERS[Number(cell['row'])]['uid'];
				historyDay = Number(cell['col']);
			}
			let historyDate = new Date(curDate.getFullYear(), curDate.getMonth(), historyDay+1);
			getDataHistory(UID, worker_uid, historyDate.format("yyyymmdd"));
			// УБРАТЬ отсюда позиционирование и показ меню!
			break;
            case "comment":
                if (selectedCells.length > 0) {
                    lastSelectedCellForComment = JSON.parse(JSON.stringify(selectedCells));
                }
                // Позиционируем окно комментария рядом с выбранной ячейкой
                let $cell = $('#' + Number(startRow+1) + '-' + Number(startCol+1) + '-day-dv');
                let cellOffset = $cell.offset();
                let cellHeight = $cell.outerHeight();
                let menuWidth = $('#add-comment-dv').outerWidth();
                let windowWidth = $(window).width();
                let margin = 10;
                let left = cellOffset.left + $cell.outerWidth() + 2;
                if (left + menuWidth > windowWidth - margin) {
                    left = cellOffset.left - menuWidth - 2;
                    if (left < margin) left = margin;
                }
                let top = cellOffset.top;
                $('#add-comment-dv').css({top: top + "px", left: left + "px"});
                $('#add-comment-dv').addClass('show');
                let cellVal = getCellValue(startRow, startCol);
                $('#add-comment-in').val(cellVal && cellVal['comment'] ? cellVal['comment'] : "");
                $('#add-comment-in').focus();
                settingComment = true;
                break;
		case "clear":
            showConfirmClearModal(function() {
                setCells("", false, true); // Сначала очистка!
                unselectCells();           // Потом снимаем выделение
                calcDays();
                code = '';
                updateInputIndicator();
            });
			break;
	}
	 $("#context-menu").hide(50);
}

function cellAction(vt){
    console.log('cellAction', selectedCells);
	setCells(vt);
	$("#cell-menu").hide(50);
	unselectCells();
}

function filterAction(act){

	switch(act){
		case "apply":			
			break;
		case "clear":
			break;
	}
	
	$('#filter-dv').hide(50);
	
	settingFilter = false;
	
}

let settingFilter = false;
function showHideFilter(){
	
	if(settingFilter){
		
		$('#filter-dv').hide(50);
	
		settingFilter = false;
		
	}else{
		$('#filter-dv').finish().toggle(50);
	
		settingFilter = true;

	}
	
}

function changeFilter(type){
	
	unselectCells();
	
	if($('#fio-filter-in').val().length > 0){
			
		for(index in CANVASES){
			
			let canvas = CANVASES[index];
			
			$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
			$('#'+canvas['id']+'-canvas').show();
		}
	}else{
								
		for(index in CANVASES){
			
			let canvas = CANVASES[index];
			
			$('#'+canvas['id']+'-head').show();
			
			if(canvas['state'] == "show" || CANVASES.length <=3){
				$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
				$('#'+canvas['id']+'-canvas').show();
			}else{
				$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/down.png")');
				$('#'+canvas['id']+'-canvas').hide();
			}
		}
	}
	
	for(let w in WORKERS){
		
		let worker = WORKERS[w];			
		let no = Number(w)+1;
		let id = no+'_'+worker['uid'];
		
		let showRow = true;
		
		if($('#fio-filter-in').val().length > 0){
			$('#clear-input-bt').show();
		}else{
			$('#clear-input-bt').hide();
		}
		
		let value = $('#fio-filter-in').val();
		let regexp = new RegExp(value, 'iu');
		let match = String(worker['fio']).match(regexp);
		
		if(match != null){
			let newFIO = $('#'+id+'-sp').text().replace(match[0], '<span class="worker-white-green">'+match[0]+'</span>');
			
			$('#'+id+'-sp').html(newFIO);			
		}else{
			$('#'+id+'-sp').html(worker['fio']);
			
			showRow = false;
		}

		$('#filter-firms-dv input').each(function(){
			let firm_uid = $(this).attr("name");	
				
			if(firm_uid == worker['firm_uid']){
				showRow = $(this).is(":checked") && showRow;
			}	
			
		});
		
		$('#filter-locations-dv input').each(function() {
			let location_uid = $(this).attr("name");	
			
			if(location_uid == worker['location_uid']){
				showRow = $(this).is(":checked") && showRow;
			}
		});
		
		$('#filter-posts-dv input').each(function() {
			let post_uid = $(this).attr("name");	
			
			if(post_uid == worker['post_uid']){
				showRow = $(this).is(":checked") && showRow;
			}
		});
		
		let master_id 	= String($('#'+id+'-row').parent().parent().attr('id')).replace('-canvas', '');	
		let chief_id 	= String($('#'+id+'-row').parent().parent().parent().attr('id')).replace('-canvas', '');
		let location_id = String($('#'+id+'-row').parent().parent().parent().parent().attr('id')).replace('-canvas', '');

		if(showRow){
			
			$('#'+id+'-row').show();
			$('#'+id+'-dv').show();
			$('#'+id+'-days-dv').show();
			$('#'+id+'-hours-dv').show();
			
			if($('#fio-filter-in').val().length > 0){	
				$('#'+location_id+'-head').show();
				$('#'+location_id+'-canvas').show();
				$('#'+chief_id+'-head').show();
				$('#'+chief_id+'-canvas').show();
				$('#'+master_id+'-head').show();
				$('#'+master_id+'-canvas').show();
			}
		}else{
			
			$('#'+id+'-row').hide();
			$('#'+id+'-dv').hide();
			$('#'+id+'-days-dv').hide();
			$('#'+id+'-hours-dv').hide();
			
			if($('#fio-filter-in').val().length > 0){	
				if($('#'+master_id+'-canvas').height() == 0){
					$('#'+master_id+'-head').hide();
					$('#'+master_id+'-canvas').hide();
				}
				
				if($('#'+chief_id+'-canvas').height() == 0){
					$('#'+chief_id+'-head').hide();
					$('#'+chief_id+'-canvas').hide();
				}
				
				if($('#'+location_id+'-canvas').height() == 0){
					$('#'+location_id+'-head').hide();
					$('#'+location_id+'-canvas').hide();
				}
			}

		}
		
	}
	
}

function clearFio(){
	$('#fio-filter-in').val("");
	
	changeFilter('fio');
}

function slideDiv(type, uid){
    console.log('slideDiv вызван:', type, uid); // Лог для отладки
    showHideInfo(null,null);

    let $head = $('#'+type+'_'+uid+'-head');
    let $canvas = $('#'+type+'_'+uid+'-canvas');
    if($canvas.is(':hidden')){
        $head.find('.toggle-bt').css('background-image', 'url("/images/report/up.png")');
        $canvas.slideDown(100);
        $head.removeClass('collapsed');
        setCookie(type+'_'+uid, "show", "/", null, null);
        // --- ДОБАВЛЕНО: раскрываем все вложенные canvases, которые не имеют collapsed ---
        if(type === 'l') {
            $canvas.find('[id$="-canvas"]').each(function() {
                let headId = $(this).attr('id').replace('-canvas', '-head');
                if (!$('#'+headId).hasClass('collapsed')) {
                    $(this).slideDown(100);
                }
            });
        }
    }else{
        $head.find('.toggle-bt').css('background-image', 'url("/images/report/down.png")');
        $canvas.slideUp(100);
        $head.addClass('collapsed');
        setCookie(type+'_'+uid, "hide", "/", null, null);
        unselectCells(); // Снимаем выделение при сворачивании
        // Принудительно скрываем все вложенные canvases и их head
        if(type === 'l') {
            $canvas.find('[id$="-canvas"]').each(function() {
                $(this).hide();
                let headId = $(this).attr('id').replace('-canvas', '-head');
                $('#'+headId).addClass('collapsed');
            });
        }
    }
}

function rollAll(way){
    switch(way){
        default:
            return;
            break;
        case "up":
            for(index in CANVASES){
                let canvas = CANVASES[index];
                $('#'+canvas['id']+'-canvas').hide();
                delCookie(canvas['id'], "/", null);
            }
           
            scrollTo(0, 0);
            break;
        case "down":         
            for(index in CANVASES){
                let canvas = CANVASES[index];
                $('#'+canvas['id']+'-canvas').show();
                setCookie(canvas['id'], "show", "/", null, null);
            }           
            break;
    }
}

// EVENTS ===========================

function showHideInfo(element, id){
	let action = "";
	if($(element).css('opacity') == .2){
		action = "show";
	}
	$('.info-row').css({opacity: .2});
	if(action == "show"){
		let id_arr  = id.split('_');
		let no     = Number(id_arr[0]);
		let uid    = id_arr[1];
		$(element).css({opacity: 1});
		let e = window.event;
		let infoDv = $("#info-dv");
		infoDv.show();
		let winH = $(window).height();
		let winW = $(window).width();
		let mouseX = e.clientX;
		let mouseY = e.clientY;
		let infoH = infoDv.outerHeight();
		let infoW = infoDv.outerWidth();
		let top, left;
		if (mouseY + 20 + infoH < winH - 20) {
			top = mouseY + 20;
		} else if (mouseY - infoH - 20 > 20) {
			top = mouseY - infoH - 20;
		} else {
			top = Math.max((winH - infoH) / 2, 20);
		}
		if (mouseX + 20 + infoW < winW - 20) {
			left = mouseX + 20;
		} else if (mouseX - infoW - 20 > 20) {
			left = mouseX - infoW - 20;
		} else {
			left = Math.max((winW - infoW) / 2, 20);
		}
		infoDv.css({top: top + "px", left: left + "px"});
		// --- ВОССТАНОВЛЕНО НАПОЛНЕНИЕ info-dv ---
		for(let w in WORKERS){
			let worker = WORKERS[w];
			if(uid == worker['uid'] && w == no-1){
				// ... existing code ...
				$('#info-dv .info-fio-dv').html("<strong>ФИО: </strong>"+worker['fio'].toUpperCase()+' <span class="copy-fio-btn" title="Копировать ФИО"><i class="fa fa-copy"></i></span>');
				
				// Добавляем обработчик копирования
				$('.copy-fio-btn').off('click').on('click', function(e) {
					e.stopPropagation();
					const fio = worker['fio'].toUpperCase();
					navigator.clipboard.writeText(fio).then(() => {
						const $btn = $(this);
						$btn.addClass('copied');
						setTimeout(() => {
							$btn.removeClass('copied');
							$('#info-dv').hide(); // Закрываем модальное окно после копирования
						}, 1000);
					});
				});
				
				$('#info-dv .info-organization-dv').html("<strong>Организация: </strong>"+worker['firm_name']);
				$('#info-dv .info-location-dv').html("<strong>Участок: </strong>"+worker['location_name']);
				let htmlChiefs = '<select id="chiefs-sl" onchange="changeChief(\"'+id+'\")\"'+(window.IS_FULL_READONLY ? ' disabled' : '')+'>';
				for(let l in LOCATIONS){
					htmlChiefs += '<optgroup label="'+LOCATIONS[l]['name']+'" value="'+LOCATIONS[l]['uid']+'" >';
					for(let c in LOCATIONS[l]['chiefs']){
						let chief = LOCATIONS[l]['chiefs'][c];
						if(worker['chief_uid'] == chief['uid'] && worker['location_uid'] == LOCATIONS[l]['uid']){
							htmlChiefs += '<option value="'+chief['uid']+'" selected="selected">'+chief['name']+'</option>';
						}else{
							htmlChiefs += '<option value="'+chief['uid']+'">'+chief['name']+'</option>';
						}
					}
					htmlChiefs += '</optgroup>';
				}
				htmlChiefs += '</select>';
				let htmlMasters = '<select id="masters-sl" onchange="changeMaster(\"'+id+'\")"'+(window.IS_FULL_READONLY ? ' disabled' : '')+'>';
				for(let l in LOCATIONS){
					htmlMasters += '<optgroup label="'+LOCATIONS[l]['name']+'" value="'+LOCATIONS[l]['uid']+'" >';
					for(let m in LOCATIONS[l]['masters']){
						let master = LOCATIONS[l]['masters'][m];
						if(worker['master_uid'] == master['uid']  && worker['location_uid'] == LOCATIONS[l]['uid']){
							htmlMasters += '<option value="'+master['uid']+'" selected="selected">'+master['name']+'</option>';
						}else{
							htmlMasters += '<option value="'+master['uid']+'">'+master['name']+'</option>';
						}
					}
					htmlMasters += '</optgroup>';
				}
				htmlMasters += '</select>';
				if(worker['is_master']){
					if(!worker['is_chief']){
						$('#info-dv .info-master-dv').html("<strong>Начальник: </strong>"+htmlChiefs);
					}else{
						$('#info-dv .info-master-dv').html("<strong>Начальник: </strong>"+htmlChiefs);
					}
				}
				if(worker['is_worker']){
					$('#info-dv .info-master-dv').html("<strong>Мастер: </strong>"+htmlMasters);
				}
				$('#info-dv .info-post-dv').html("<strong>Должность: </strong>"+worker['post_name']);
				$('#info-dv .info-category-dv').html("<strong>Разряд: </strong>"+worker['category_name']);
				$('#info-dv .info-birthday-dv').html("<strong>Дата рождения: </strong>"+worker['birthday']+" ("+worker['age']+" л.)");
				$('#info-dv .info-data-in-dv').html("<strong>Дата приёма: </strong>" + (worker['date_in'] ? worker['date_in'] : '-'));
				$('#info-dv .info-data-out-dv').html("<strong>Дата увольнения: </strong>" + (worker['date_out'] ? worker['date_out'] : '-'));
				// --- Показываем кнопку сохранить только если выбран другой мастер или начальник ---
				let showSave = false;
				if(worker['master_uid'] !== undefined && $('#masters-sl').length && $('#masters-sl').val() != worker['master_uid']) {
					showSave = true;
				}
				if(worker['chief_uid'] !== undefined && $('#chiefs-sl').length && $('#chiefs-sl').val() != worker['chief_uid']) {
					showSave = true;
				}
				if(showSave) {
					console.log('[info-save-dv] show (условие выполнено)');
					$('#info-dv .info-save-dv').show().css('display', 'block');
				} else {
					console.log('[info-save-dv] hide (условие не выполнено)');
					$('#info-dv .info-save-dv').hide();
				}
				// --- Обработчики onchange для select'ов ---
				setTimeout(function() {
					$('#masters-sl').off('change.infoSave').on('change.infoSave', function() {
						let showSave = false;
						if(worker['master_uid'] !== undefined && $('#masters-sl').val() != worker['master_uid']) showSave = true;
						if(worker['chief_uid'] !== undefined && $('#chiefs-sl').length && $('#chiefs-sl').val() != worker['chief_uid']) showSave = true;
						if(showSave) {
							console.log('[info-save-dv] show (onchange)');
							$('#info-dv .info-save-dv').show().css('display', 'block');
						} else {
							console.log('[info-save-dv] hide (onchange)');
							$('#info-dv .info-save-dv').hide();
						}
					});
					$('#chiefs-sl').off('change.infoSave').on('change.infoSave', function() {
						let showSave = false;
						if(worker['master_uid'] !== undefined && $('#masters-sl').length && $('#masters-sl').val() != worker['master_uid']) showSave = true;
						if(worker['chief_uid'] !== undefined && $('#chiefs-sl').val() != worker['chief_uid']) showSave = true;
						if(showSave) {
							console.log('[info-save-dv] show (onchange)');
							$('#info-dv .info-save-dv').show().css('display', 'block');
						} else {
							console.log('[info-save-dv] hide (onchange)');
							$('#info-dv .info-save-dv').hide();
						}
					});
				}, 0);
				// --- Обработчик нажатия на кнопку сохранить ---
				$('#info-dv .info-save-dv').off('click.save').on('click.save', function() {
					let changed = false;
					if(worker['master_uid'] !== undefined && $('#masters-sl').length && $('#masters-sl').val() != worker['master_uid']) {
						// Изменён мастер
						console.log('[info-save-dv] Отправка изменения мастера', {worker_id: id, new_master: $('#masters-sl').val()});
						changeMaster(id);
						changed = true;
					}
					if(worker['chief_uid'] !== undefined && $('#chiefs-sl').length && $('#chiefs-sl').val() != worker['chief_uid']) {
						// Изменён начальник
						console.log('[info-save-dv] Отправка изменения начальника', {worker_id: id, new_chief: $('#chiefs-sl').val()});
						changeChief(id);
						changed = true;
					}
					if(changed) {
						$(this).hide();
					}
				});
			}
		}
		$('#info-dv .info-save-dv').hide();
		$('#info-dv').show();
	} else {
		$('#info-dv .info-save-dv').hide();
		$('#info-dv').hide();
	}
}

function setMouseUpState(e) {
    let flags = e.buttons !== undefined ? e.buttons : e.which;

    mouseUp     = (flags & 1) === 1;
    mouseDown   = false;
    
    // Убираем автоматическое закрытие модалки комментариев
    // if(settingComment && !$(e.target).parents("#add-comment-dv").length > 0){
    //     setTimeout(() => {
    //         setComment(true);
    //     }, 100);
    // }
    
    if(settingFilter && ($(e.target).parents("#workers").length > 0 || $(e.target).parents("#field").length > 0)){
        $('#filter-dv').hide(50);
        settingFilter = false;
    }
    
    TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
}

function setMouseDownState(e) {
  
	let flags = e.buttons !== undefined ? e.buttons : e.which;

	mouseUp 	= false;
	mouseDown 	= (flags & 1) === 1;
	
	if("which" in e){
		isLeftMB 	= e.which == 1;
		isRightMB 	= e.which == 3;
	}else if("button" in e){
		isLeftMB 	= e.button == 1;
		isRightMB 	= e.button == 2;
	}
  
	if(flags > 0 && !$(e.target).parents("#context-menu").length > 0){
		//$("#context-menu").hide(50);	console.log("down");	
	}
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
}

let code = '';
function blockFunctionKeys(e) {
    // Если открыто модальное окно переноса, блокируем все клавиши для табеля
    if ($('#move-worker-modal').is(':visible')) {
        // Разрешаем ввод только в поле даты модального окна
        if (!$(e.target).is('#move-worker-date')) {
            e.preventDefault();
            return false;
        }
    }
    return true;
}

// Добавляем обработчик клавиатуры
$(document).on('keydown', function(e) {
    return blockFunctionKeys(e);
});

// Добавляем обработчики на разных уровнях
window.addEventListener('keydown', blockFunctionKeys, true);
document.addEventListener('keydown', blockFunctionKeys, true);
$(document).on('keydown', blockFunctionKeys);

function setCellVal(e){
    // Если открыто модальное окно переноса, блокируем ввод в ячейки
    if ($('#move-worker-modal').is(':visible')) {
        return;
    }
    
    if(settingComment){
        return;
    }

    window.lastKeyCode = e.keyCode;
    // Блокировка функциональных клавиш в начале функции
    if (
        (typeof e.keyCode === 'number' && e.keyCode >= 112 && e.keyCode <= 123) ||
        (typeof e.key === 'string' && /^F([1-9]|1[0-2])$/.test(e.key))
    ) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
        e.stopImmediatePropagation && e.stopImmediatePropagation();
        return false;
    }
    
    console.log('[DEBUG] setCellVal вызван', {event: e, selectedCells, isReadOnlyRowSelected: typeof isReadOnlyRowSelected !== 'undefined' ? isReadOnlyRowSelected : undefined, tabelIsSaving: window.tabelIsSaving});
	
	if($(document.activeElement).attr('id') == "fio-filter-in") return;
	
	let isShift;
	let keynum;
 
	if(window.event){
		isShift = !!window.event.shiftKey;
		keynum  = e.keyCode;
	}else if(e.which){
		isShift = !!ev.shiftKey;
		keynum  = e.which;
	}

	// Логика Excel-подобного выделения через Shift
	if (isShift && !wasShift) {
		startRow = curRow;
		startCol = curCol;
	}
	if (!isShift) {
		startRow = curRow;
		startCol = curCol;
	}
	wasShift = isShift;
	
	if(settingComment){
		
        switch(keynum){
            default:
                // Блокируем F1-F12 даже если дошли до сюда
                if (keynum >= 112 && keynum <= 123) {
                    return;
                }
				break;
			case 13: //enter
				setComment(false);
				break;
			case 27: //esc
				setComment(true);
				break;
			}
		
	}else{
		// === БЛОКИРОВКА ВВОДА ПРИ СОХРАНЕНИИ ===
		if(window.tabelIsSaving) {
			showSavingAlert();
			return;
		}
		switch(keynum){
            default:
                // Блокируем F1-F12 даже если дошли до сюда
                if (keynum >= 112 && keynum <= 123) {
                    return;
                }

				let key = String(e.key).toLowerCase();
				
				if(symbolsDi.includes(key)){
				
					if(Number(code+key.toUpperCase()) > 16 || !codesRu.includes(String(code+key.toUpperCase()))){
						code = key.toUpperCase();
					}else{
						code+= key.toUpperCase();
					}
				
				}else if(symbolsRu.includes(key)){
					
					if(!codesRu.includes(String(code+key.toUpperCase()))){
						code = key.toUpperCase();
					}else{
						code+= key.toUpperCase();
					}
					
				}else if(symbolsEn.includes(key)){
					let index = symbolsEn.indexOf(key);
					
					key = symbolsRu[index];
					
					if(!codesRu.includes(String(code+String(key).toUpperCase()))){
						code = String(key).toUpperCase();
					}else{
						code+= String(key).toUpperCase();
					}
				}	
				
				if(code.length > 2) code = code.substring(code.length - 1);
				updateInputIndicator();
				setCells(code.trim().toUpperCase());
				calcDays();
				// === ИЗМЕНЕНО: Убираем остановку распространения события ===
                // if (e.stopPropagation) e.stopPropagation();
                // if (e.preventDefault) e.preventDefault();
				return;
				break;
			case 16: case 17: case 18: //shift ctrl alt
				
				break;
			case 9: case 32: //tab space
				break;
			case 13: //enter
				if(code != '' && codesRu.includes(code)) setCells(code);
				unselectCells();
				calcDays();
				code = '';
				updateInputIndicator();
				break;
			case 27: //esc
				unselectCells();
				code = '';
				updateInputIndicator();
				break;
			case 8: case 32: case 46: //backspace space delete
            showConfirmClearModal(function() {
                setCells("", false, true); // Сначала очистка!
                unselectCells();           // Потом снимаем выделение
                calcDays();
                code = '';
                updateInputIndicator();
            });
				break;
			case 37: //left
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newCol = curCol;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newCol--;
				} while (newCol >= 0 && !isCellVisible('#'+Number(curRow+1)+'-'+Number(newCol+1)+'-day-dv'));
				if (newCol >= 0) {
					if(!isShift){
						unselectCells();
						selectCell(curRow, newCol, e);
						curCol = newCol;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curCol = newCol;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
			case 38: //up
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newRowUp = curRow;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newRowUp--;
				} while (newRowUp >= 0 && !isCellVisible('#'+Number(newRowUp+1)+'-'+Number(curCol+1)+'-day-dv'));
				if (newRowUp >= 0) {
					if(!isShift){
						unselectCells();
						selectCell(newRowUp, curCol, e);
						curRow = newRowUp;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curRow = newRowUp;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curRow+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
			case 39: //right
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newColR = curCol;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newColR++;
				} while (newColR < DAYS.length && !isCellVisible('#'+Number(curRow+1)+'-'+Number(newColR+1)+'-day-dv'));
				if (newColR < DAYS.length) {
					if(!isShift){
						unselectCells();
						selectCell(curRow, newColR, e);
						curCol = newColR;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curCol = newColR;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
			case 40: //down
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newRowDown = curRow;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newRowDown++;
				} while (newRowDown < WORKERS.length && !isCellVisible('#'+Number(newRowDown+1)+'-'+Number(curCol+1)+'-day-dv'));
				if (newRowDown < WORKERS.length) {
					if(!isShift){
						unselectCells();
						selectCell(newRowDown, curCol, e);
						curRow = newRowDown;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curRow = newRowDown;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
		}
		
		if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
			e.preventDefault();
		}
		
	}
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
	
}

function onRightClick(){
    // Получаем id ячейки под курсором
    let e = window.event;
    let $target = $(e.target).closest('[id$="-day-dv"]');
    if ($target.length) {
        let id = $target.attr('id'); // например, "5-7-day-dv"
        let match = id.match(/^([0-9]+)-([0-9]+)-day-dv$/);
        if (match) {
            startRow = parseInt(match[1], 10) - 1;
            startCol = parseInt(match[2], 10) - 1;
        }
    }
    selectCell(startRow, startCol,null);

    if(selectedCells.length != 1) return;

    $("#context-menu").finish().toggle(50);

    let X = (e.clientX+310 > $(window).width()) ? $(window).width()-310 : e.pageX+10;
    let Y = (e.clientY+100 > $(window).height()) ? $(window).height()-140 : e.clientY+10;

    $("#context-menu").css({top: Y + "px", left:  X + "px"});
}

function onDoubleClick(){
    // Запрет в режиме только для чтения
    if (window.IS_FULL_READONLY) return;
    // Получаем ячейку, по которой был двойной клик
    let cell = selectedCells.length > 0 ? selectedCells[0] : {row: startRow, col: startCol};
    let $cell = $('#' + Number(cell.row+1) + '-' + Number(cell.col+1) + '-day-dv');
    // Если ячейка фиксированная — ничего не делаем
    if ($cell.hasClass('cell-fixed') || $cell.attr('data-fixed') == '1') {
        return;
    }
    // Если выделено несколько ячеек — не трогаем выделение
    if (selectedCells.length > 1) {
        // только показываем меню
    } else {
        // если выделена одна или ни одна — выделяем текущую
        let value = getCellValue(startRow, startCol);
        selectCell(startRow, startCol,null);
    }
    let $menu = $("#cell-menu");
    $menu.show();
    // Показываем меню относительно первой выделенной ячейки (или текущей)
    showMenuNearCell($cell, $menu, 1);
    $menu.finish().fadeIn(50);
}

function scrollDocument(e){
	
	$("#context-menu").hide();
	$("#cell-menu").hide();
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
	
	var $elems = [].slice.call(document.querySelectorAll('.master-head'));

	$elems.forEach(checkStickyState);
	
	
}

function checkStickyState($elem) {
    let currentOffset = $elem.getBoundingClientRect().top;
    let stickyOffset = parseInt(getComputedStyle($elem).top.replace("px", ""));
    let isStuck = currentOffset <= stickyOffset;

	let master_id = String($($elem).attr('id')).replace('-head', '');
    
	if(isStuck){
		$('#'+master_id+'-short-sp').hide();
		$('#'+master_id+'-full-sp').show();
    } else {
		$('#'+master_id+'-short-sp').show();
		$('#'+master_id+'-full-sp').hide();
    }
  }

// Проверка видимости ячейки и её родительских блоков
function isCellVisible(cellSelector) {
    const $cell = $(cellSelector);
    if ($cell.length === 0) return false;
    // Проверяем родителей: master, chief, location
    // master: ближайший .workers
    let $master = $cell.closest('.workers');
    if ($master.length && !$master.is(':visible')) return false;
    // chief: ближайший [id^='c_'][id$='-canvas']
    let $chief = $cell.closest("[id^='c_'][id$='-canvas']");
    if ($chief.length && !$chief.is(':visible')) return false;
    // location: ближайший [id^='l_'][id$='-canvas']
    let $location = $cell.closest("[id^='l_'][id$='-canvas']");
    if ($location.length && !$location.is(':visible')) return false;
    // Сама ячейка
    if (!$cell.is(':visible')) return false;
    return true;
}

function scrollCellIntoViewWithHeader(cellSelector) {
    if (!isCellVisible(cellSelector)) return;
    const $cell = $(cellSelector);
    if ($cell.length === 0) return;
    const cellRect = $cell[0].getBoundingClientRect();
    const headerHeight = 202; // высота фиксированной шапки
    const rowHeight = 32;     // высота строки таблицы
    // Смещение: шапка + одна строка + 1px
    const offset = headerHeight + rowHeight + 1;
    if (cellRect.top < offset) {
        window.scrollBy({
            top: cellRect.top - offset,
            behavior: 'smooth'
        });
    } else if (cellRect.bottom > window.innerHeight - rowHeight) {
        window.scrollBy({
            top: cellRect.bottom - window.innerHeight + rowHeight,
            behavior: 'smooth'
        });
    }
}

// Функция для выделения прямоугольной области
function selectRectangle(startRow, startCol, endRow, endCol) {
    lastColSelectionByHeader = false;
    unselectCells();
    let minRow = Math.min(startRow, endRow);
    let maxRow = Math.max(startRow, endRow);
    let minCol = Math.min(startCol, endCol);
    let maxCol = Math.max(startCol, endCol);
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            if (!isCellVisible('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv')) continue;
            let cell = {};
            cell['row'] = row;
            cell['col'] = col;
            selectedCells.push(cell);
            $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css('background', selectedBgd);
            $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css('color', selectedFnt);
            $('#'+Number(row+1)+'number-row').css('background', selectedBgd);
            $('#0_'+Number(col)+'-day-dv').css('background', selectedBgd);
        }
    }
    saveScrollCellToCookie();
    saveLastCellToStorage();
}

// Универсальная функция позиционирования меню рядом с ячейкой
function showMenuNearCell($cell, $menu, offsetCol = 1) {
    // offsetCol: -1 (левее), 0 (по умолчанию), 1 (правее)
    let $targetCell = $cell;
    if (offsetCol !== 0) {
        // Получаем координаты текущей ячейки
        let id = $cell.attr('id'); // например, "5-7-day-dv"
        let match = id && id.match(/^(\d+)-(\d+)-day-dv$/);
        if (match) {
            let row = parseInt(match[1], 10);
            let col = parseInt(match[2], 10) + offsetCol;
            let $candidate = $('#' + row + '-' + col + '-day-dv');
            if ($candidate.length > 0 && $candidate.is(':visible')) {
                $targetCell = $candidate;
            }
        }
    }
    // Временно показываем меню невидимо для измерения размеров
    $menu.css({display: 'block', visibility: 'hidden'});
    let menuWidth = $menu.outerWidth();
    let menuHeight = $menu.outerHeight();
    $menu.css({display: '', visibility: ''});

    let cellRect = $targetCell[0].getBoundingClientRect();
    let windowWidth = $(window).width();
    let windowHeight = $(window).height();
    let margin = 10;

    let X = cellRect.left + window.scrollX;
    let Y = cellRect.bottom + window.scrollY;

    if (X + menuWidth > windowWidth + window.scrollX - margin) {
        X = windowWidth + window.scrollX - menuWidth - margin;
    }
    if (X < window.scrollX + margin) X = window.scrollX + margin;

    if (cellRect.bottom + menuHeight > windowHeight) {
        Y = cellRect.top + window.scrollY - menuHeight;
        if (Y < window.scrollY + margin) Y = window.scrollY + margin;
    }

    $menu.css({top: Y + "px", left: X + "px"});
}

// Глобальные функции для истории ячейки
async function getDataHistory(UID, worker_uid, date){
    if(!UID || !worker_uid || !date) return;
    let data = await getData(false, false, "ПолучитьИсториюДанных", [worker_uid, date]);
    if(data){
        if(!data.error && data.valid){
            createHistory(data.result);
        }else{
            console.log(data.des);
            $('#loader_dv').hide();
            $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
            $('#loader_des').append(data.des);
            $('#loader_des').show();
            $('#loader').show();
        }
    }else{
        console.log(data.des);
        $('#loader_dv').hide();
        $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
        $('#loader_des').append(data.des);
        $('#loader_des').show();
        $('#loader').show();
    }
}

function createHistory(data){
    // Логируем полученные данные истории
    console.log('История редактирования (ответ сервера):', JSON.stringify(data, null, 2));
    $('#history-menu').empty().hide();
    // Больше не фильтруем по vt/hours, показываем все записи
    if(!data || data.length === 0) {
        $('#history-menu').html('<li style="color:#888;">Нет изменений</li>').show();
        return;
    }
    let html = '';
    for(let i in data){
        let item = data[i];
        html += '<li>';
        html += item.datetime+' <strong>['+(item.vt == null || item.vt == '' ?  ' ' : item.vt)+(item.hours > 0 ? '<sub>'+item.hours+'</sub>' : '')+']</strong> '+item.user;
        html += '</li>';
    }
    setTimeout(function(){
        if(html) {
            $('#history-menu').html(html);
            let $cell = $('#' + Number(startRow+1) + '-' + Number(startCol+1) + '-day-dv');
            let cellOffset = $cell.offset();
            let cellHeight = $cell.outerHeight();
            $('#history-menu').css({display: 'block', visibility: 'hidden'});
            let menuWidth = $('#history-menu').outerWidth();
            let menuHeight = $('#history-menu').outerHeight();
            $('#history-menu').css({display: '', visibility: ''});
            let windowWidth = $(window).width();
            let windowHeight = $(window).height();
            let margin = 10;
            let left = cellOffset.left + $cell.outerWidth() + 2;
            if (left + menuWidth > windowWidth - margin) {
                left = cellOffset.left - menuWidth - 2;
                if (left < margin) left = margin;
            }
            // --- Автоматический выбор позиции ---
            let topBelow = cellOffset.top + cellHeight + 5;
            let topAbove = cellOffset.top - menuHeight - 5;
            let top;
            if (topBelow + menuHeight < windowHeight - margin) {
                // Влезает снизу
                top = topBelow;
            } else if (topAbove > margin) {
                // Влезает сверху
                top = topAbove;
            } else {
                // По центру окна, если не влезает ни сверху, ни снизу
                top = Math.max((windowHeight - menuHeight) / 2 + $(window).scrollTop(), margin);
            }
            $('#history-menu').css({
                top: top + 'px',
                left: left + 'px',
                display: 'block',
                visibility: 'visible'
            }).hide().fadeIn(200); // Плавное появление
        }
    }, 500);
}

$(document).on('mousedown', function(e) {
    console.log('[LOG] mousedown', {target: e.target, e});
    if (
        !(e.ctrlKey || e.shiftKey || e.metaKey) && // <--- вот это добавьте!
        !$(e.target).closest('#cell-menu').length &&
        !$(e.target).closest('#confirm-clear-modal').length &&
        !$(e.target).closest('[id$="-day-dv"]').length
    ) {
        unselectCells();
    }
});

// Скрытие меню при клике вне его:
$(document).on('mousedown', function(e) {
    if (!$(e.target).closest('#history-menu').length) {
        $('#history-menu').fadeOut(200);
    }
});

let tooltipTimeoutId = null; // Глобальная переменная для таймера тултипа
let tooltipHideTimeoutId = null; // Новая переменная для таймера скрытия тултипа

// Функция для определения индекса дня для статистики
function getStatsDayIndex() {
    // Проверяем, является ли текущий месяц предыдущим
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Получаем дату из URL или из текущей даты
    let urlParams = new URLSearchParams(window.location.search);
    let dateParam = urlParams.get('date');
    let viewDate = dateParam ? new Date(dateParam) : new Date();
    let viewMonth = viewDate.getMonth();
    let viewYear = viewDate.getFullYear();
    
    // Определяем индекс дня для статистики
    let todayIndex = typeof TODAY !== 'undefined' ? TODAY : 0;
    
    // Если просматриваем предыдущий месяц, используем последний день этого месяца
    if (viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth)) {
        let lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
        todayIndex = lastDay - 1; // -1 потому что индексация с 0
    }
    
    return todayIndex;
}

// Обновляем функцию initTooltips
function initTooltips() {
    const tooltip = $('#master-tooltip');
    if (!tooltip.length) {
        $('body').append('<div id="master-tooltip" class="tooltip-popup" style="position: absolute; z-index: 9999; background: white; border: 1px solid #788cad; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border-radius: 5px; padding: 10px; display: none; max-width: 400px;"></div>');
        return initTooltips();
    }
    tooltip.css({
        'z-index': 9999,
        'border': '1px solid #788cad',
        'box-shadow': '0 3px 8px rgba(0,0,0,0.3)',
        'border-radius': '5px',
        'padding': '10px',
        'max-width': '400px',
        'background-color': '#fff',
        'font-size': '12px',
        'line-height': '1.4'
    });
    window.SAVED_DATA = DATA;
    window.SAVED_TODAY = TODAY;
    // Снимаем предыдущие обработчики
    $(document).off('mouseenter.genericTooltip mouseleave.genericTooltip');
    // Навешиваем только на строку "Пустых"
    $(document).on('mouseenter.genericTooltip', '[id$="-empty-sp"]', function(e){
        const $hoveredElement = $(this);
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId);
        }
        // Определяем тип head по родителю
        let $head = $hoveredElement.closest('.master-head, .chief-head, .location-head');
        let elementType = '';
        if ($head.hasClass('master-head')) elementType = 'master';
        else if ($head.hasClass('chief-head')) elementType = 'chief';
        else if ($head.hasClass('location-head')) elementType = 'location';
        // Индексы для поиска
        const locationIdx = $head.data('location-idx');
        const chiefIdx = $head.data('chief-idx');
        const masterIdx = $head.data('master-idx');
        
        tooltipTimeoutId = setTimeout(function() {
            let workersForTooltip = [];
            let savedData = window.SAVED_DATA;
            let todayIndex = getStatsDayIndex();
            
            // Проверяем, является ли текущий месяц предыдущим
            let currentDate = new Date();
            let currentMonth = currentDate.getMonth();
            let currentYear = currentDate.getFullYear();
            
            // Получаем дату из URL или из текущей даты
            let urlParams = new URLSearchParams(window.location.search);
            let dateParam = urlParams.get('date');
            let viewDate = dateParam ? new Date(dateParam) : new Date();
            let viewMonth = viewDate.getMonth();
            let viewYear = viewDate.getFullYear();
            
            // Если просматриваем предыдущий месяц, используем последний день этого месяца
            if (viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth)) {
                let lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
                todayIndex = lastDay - 1; // -1 потому что индексация с 0
            }
            
            // Собираем работников для тултипа
            if (elementType === 'master' && typeof locationIdx !== 'undefined' && typeof chiefIdx !== 'undefined' && typeof masterIdx !== 'undefined' && locationIdx >= 0 && locationIdx < savedData.length) {
                const location = savedData[locationIdx];
                if (location && location.chiefs && chiefIdx in location.chiefs) {
                    const chief = location.chiefs[chiefIdx];
                    if (chief && chief.masters && masterIdx in chief.masters) {
                        const master = chief.masters[masterIdx];
                        if (master && master.workers) {
                            workersForTooltip.push(...master.workers);
                        }
                    }
                }
            } else if (elementType === 'chief' && typeof locationIdx !== 'undefined' && typeof chiefIdx !== 'undefined' && locationIdx >= 0 && locationIdx < savedData.length) {
                const location = savedData[locationIdx];
                if (location && location.chiefs && chiefIdx in location.chiefs) {
                    const chief = location.chiefs[chiefIdx];
                    if (chief && chief.masters) {
                        for (let m_key in chief.masters) {
                            const master = chief.masters[m_key];
                            if (master && master.workers) {
                                workersForTooltip.push(...master.workers);
                            }
                        }
                    }
                }
            } else if (elementType === 'location' && typeof locationIdx !== 'undefined' && locationIdx >= 0 && locationIdx < savedData.length) {
                const location = savedData[locationIdx];
                if (location && location.chiefs) {
                    for (let c_key in location.chiefs) {
                        const chief = location.chiefs[c_key];
                        if (chief.masters) {
                            for (let m_key in chief.masters) {
                                const master = chief.masters[m_key];
                                if (master.workers) {
                                    workersForTooltip.push(...master.workers);
                                }
                            }
                        }
                    }
                }
            }
            
            // Формируем статистику для тултипа
            let statsTableHtml = '';
            if (typeof DAYS !== 'undefined' && Array.isArray(DAYS) && DAYS.length > 0) {
                const filteredWorkers = workersForTooltip.filter(
                    w => w && w.uid && w.fio && typeof w.fio === 'string' && !/^[<‹]/.test(w.fio.trim())
                );
                let countY = 0;
                let countB = 0;
                let countEmpty = 0;
                let detailedNotPresentCounts = {'НН': 0, 'НВ': 0, 'Г': 0, 'МО': 0};
                let detailedAbsentCounts = {'ОТ': 0, 'ОД': 0, 'У': 0, 'ОБ': 0, 'ПК': 0, 'Д': 0, 'СО': 0, 'УВ': 0, 'Р': 0, 'ОЖ': 0, 'ДО': 0, 'В': 0, 'К': 0, 'ПЧ':0};
                let totalWorkers = 0;
                
                for(let w_idx in filteredWorkers){
                    let worker = filteredWorkers[w_idx];
                    let dayObj = worker.days && worker.days[todayIndex];
                    let vt = (dayObj && 'vt' in dayObj) ? String(dayObj.vt).toUpperCase() : '';
                    let hours = (dayObj && 'hours' in dayObj) ? Number(dayObj.hours) : 0;
                    
                    if (!dayObj || (typeof dayObj !== 'object')) {
                        countEmpty++;
                        totalWorkers++;
                        continue;
                    }
                    totalWorkers++;
                    if (
                        (!('vt' in dayObj) && !('hours' in dayObj)) ||
                        (vt === '' && hours === 0)
                    ) {
                        countEmpty++;
                        continue;
                    }
                    if (vt === 'Я') {
                        countY++;
                    } else if (vt === 'Б') {
                        countB++;
                    } else if (detailedNotPresentCounts.hasOwnProperty(vt)) {
                        detailedNotPresentCounts[vt]++;
                    } else if (detailedAbsentCounts.hasOwnProperty(vt)) {
                        detailedAbsentCounts[vt]++;
                    } else if (vt === '') {
                        countEmpty++;
                    }
                }
                
                let sumNotPresent = countB + detailedNotPresentCounts['НВ'] + detailedNotPresentCounts['Г'] + detailedNotPresentCounts['МО'];
                let sumAbsent = 0;
                for (const code in detailedAbsentCounts) {
                    sumAbsent += detailedAbsentCounts[code];
                }
                
                statsTableHtml = `
                <div class="master-tooltip-content">
                    <table style="width:100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                        <tr>
                             <td style="padding: 2px;font-weight: bold; font-size: 13px;">На объекте</td>
                             <td style="padding: 2px; text-align:right; font-weight: bold; font-size: 13px;">${totalWorkers - sumAbsent}</td>
                        </tr>
                    </table>
                    <table style="width:100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                        <tr>
                             <td style="padding: 2px;font-weight: bold; font-size: 13px;">Явка</td>
                             <td style="padding: 2px; text-align:right; font-weight: bold; font-size: 13px;">${countY}</td>
                        </tr>
                    </table>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                        <div style="width: 48%;">
                            <table style="width:100%; border-collapse: collapse;">
                                <tr><td style="padding: 1px 2px; font-weight: bold; font-size: 13px;">Не выход</td><td style="padding: 1px 2px; text-align:right; font-weight: bold;font-size: 13px"> ${sumNotPresent}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Б</td><td style="padding: 1px 2px; text-align:right;">${countB}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">НВ</td><td style="padding: 1px 2px; text-align:right;">${detailedNotPresentCounts['НВ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Г</td><td style="padding: 1px 2px; text-align:right;">${detailedNotPresentCounts['Г']}</td></tr>
                                <tr><td style="padding: 1px 2px;">МО</td><td style="padding: 1px 2px; text-align:right;">${detailedNotPresentCounts['МО']}</td></tr>
                            </table>
                        </div>
                        <div style="width: 48%;">
                            <table style="width:100%; border-collapse: collapse;">
                                <tr><td style="padding: 1px 2px; font-weight: bold; font-size: 13px;">Отсутствуют</td><td style="padding: 1px 2px; text-align:right; font-weight: bold;font-size: 13px">${sumAbsent}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ОТ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОТ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ОД</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОД']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">У</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['У']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ОБ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОБ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ПК</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ПК']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Д</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['Д']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">СО</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['СО']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">УВ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['УВ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Р</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['Р']}</td></tr>
                                <tr><td style="padding: 1px 2px;">ОЖ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОЖ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ДО</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ДО']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">В</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['В']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">К</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['К']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ПЧ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ПЧ']}</td></tr>
                            </table>
                        </div>
                    </div>
                    <table style="width: 100%; margin-top: 5px; border-collapse: collapse;">
                         <tr>
                            <td style="padding: 1px 2px; width: 20%; font-weight: bold; font-size: 13px;">НН</td>
                            <td style="padding: 1px 2px; text-align:right; width: 28%; font-weight: bold; font-size: 13px;">${detailedNotPresentCounts['НН']}</td>
                            <td style="padding: 1px 2px; width: 20%; padding-left: 10px; font-weight: bold; font-size: 13px;">Пусто</td>
                            <td style="padding: 1px 2px; text-align:right; width: 28%; font-weight: bold; font-size: 13px;">${countEmpty}</td>
                        </tr>
                    </table>
                </div>
                `;
            }
            
            if (!statsTableHtml) {
                tooltip.hide();
                return;
            }
            
            tooltip.html(statsTableHtml);
            // Позиционирование тултипа относительно строки "Пустых"
            let $anchor = $hoveredElement;
            let offset = $anchor.offset();
            let anchorWidth = $anchor.outerWidth();
            let anchorHeight = $anchor.outerHeight();
            let menuWidth = tooltip.outerWidth();
            let menuHeight = tooltip.outerHeight();
            let windowWidth = $(window).width();
            let windowHeight = $(window).height();
            let scrollTop = $(window).scrollTop();
            let margin = 10;
            let left = offset.left + anchorWidth - menuWidth;
            if (left < margin) {
                left = margin;
            }
            if (left + menuWidth > windowWidth - margin) {
                left = windowWidth - menuWidth - margin;
            }
            let top = offset.top + anchorHeight + 5;
            if (top + menuHeight > windowHeight + scrollTop - margin) {
                top = offset.top - menuHeight - 5;
                if (top < scrollTop + margin) {
                    top = Math.max((windowHeight - menuHeight) / 2 + scrollTop, scrollTop + margin);
                }
            }
            tooltip.css({
                opacity: 0,
                top: top + 'px',
                left: left + 'px'
            }).show().animate({opacity: 1}, 150);
        }, 1000);
    });
    $(document).on('mouseleave.genericTooltip', '[id$="-empty-sp"]', function(){
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId);
        }
        if (tooltipHideTimeoutId) {
            clearTimeout(tooltipHideTimeoutId);
        }
        tooltipHideTimeoutId = setTimeout(() => {
            tooltip.fadeOut(100);
        }, 300);
    });
    tooltip.on('mouseenter', function() {
        if (tooltipHideTimeoutId) {
            clearTimeout(tooltipHideTimeoutId);
        }
    }).on('mouseleave', function() {
        tooltip.stop(true, true).fadeOut(100);
    });
}

// Также вызываем initTooltips только при загрузке страницы,
// а не после каждого вызова getDataTabel, так как сам getDataTabel
// теперь вызывает initTooltips только после успешной загрузки данных
$(document).ready(function() {
    // --- ДОБАВЛЕНО: Сброс куки режима полного просмотра при загрузке страницы ---
    setFullReadonlyCookie(false); // Убедитесь, что false корректно сбрасывает куку

    $(document).on('mousedown.hideInfoDv', function(e) {
        if ($('#info-dv').is(':visible') && !$(e.target).closest('#info-dv').length && !$(e.target).hasClass('info-row')) {
            $('#info-dv').hide();
        }
    });
    $(window).on('scroll.hideInfoDv', function() {
        if ($('#info-dv').is(':visible')) {
            $('#info-dv').hide();
        }
    });
});

// Добавляем индикатор ввода при загрузке страницы
$(document).ready(function() {
    if ($('#input-indicator').length === 0) {
        $('body').append('<div id="input-indicator" style="position:fixed;top:210px;right:30px;background:#fff;border:1px solid #ccc;padding:3px 8px;border-radius:5px;box-shadow:0 2px 6px #0002;display:none;font-size:16px;"></div>');
    }
});

// Функция для обновления индикатора ввода
function updateInputIndicator() {
    if (code && code.length > 0) {
        $('#input-indicator').text(code).show();
    } else {
        $('#input-indicator').hide();
    }
}

// Показываем модальное окно подтверждения удаления
function showConfirmClearModal(onConfirm) {
    $('#confirm-clear-modal').show();
    $('#confirm-clear-yes').off('click').on('click', function() {
        if (typeof onConfirm === 'function') onConfirm(); // СНАЧАЛА очистка!
        $('#confirm-clear-modal').hide();                 // ПОТОМ скрытие модалки
    });
    $('#confirm-clear-no').off('click').on('click', function() {
        $('#confirm-clear-modal').hide();
    });
}

// === Фильтр по организациям (overlay) ===
$(document).ready(function () {
  

  // Открытие/закрытие overlay
  $('#open-org-filter').on('click', function() {
    $('#org-filter-overlay').show();
  });
  $('#close-org-filter').on('click', function() {
    $('#org-filter-overlay').hide();
  });

  // Генерация списка организаций (вызывать после получения organizations)
  window.renderOrgFilter = function(organizations) {
    let selectedArr = [];
    try {
      selectedArr = JSON.parse(localStorage.getItem('org_filter_uids') || '[]');
    } catch(e) { selectedArr = []; }
    // Добавляем "Без организации" как обычную организацию
    let orgs = organizations.filter(org => org.firm_uid).map(org => ({...org}));
    orgs.push({ firm_uid: null, firm_name: 'Без организации' });
    let orgUids = orgs.map(org => org.firm_uid === null ? 'null' : org.firm_uid);
    let orgCount = orgUids.length;
    let allChecked = (selectedArr.length === 0 || selectedArr.length === orgCount);
    let html = `<label><input type="checkbox" id="org-all-checkbox" ${(allChecked ? 'checked' : '')}>Все</label>`;
    orgs.forEach(org => {
      let value = org.firm_uid === null ? 'null' : org.firm_uid;
      let checked = (selectedArr.length === 0) ? 'checked' : (selectedArr.includes(value) ? 'checked' : '');
      html += `<label><input type="checkbox" class="org-checkbox" value="${value}" ${checked}>${org.firm_name}</label>`;
    });
    $('#org-filter-list').html(html);
  };

  // Событие для чекбокса "Все"
  $('#org-filter-list').on('change', '#org-all-checkbox', function() {
    let checked = $(this).is(':checked');
    let orgCheckboxes = $('#org-filter-list .org-checkbox');
    if (checked) {
      orgCheckboxes.prop('checked', true);
      localStorage.setItem('org_filter_uids', JSON.stringify([])); // [] = все
    } else {
      orgCheckboxes.prop('checked', false);
      localStorage.setItem('org_filter_uids', JSON.stringify([]));
    }
    // applyOrgFilter(); // Убираем автоприменение
  });

  // Событие выбора чекбоксов организаций
  $('#org-filter-list').on('change', '.org-checkbox', function() {
    let arr = [];
    $('#org-filter-list .org-checkbox:checked').each(function() {
      arr.push($(this).val());
    });
    let orgCount = $('#org-filter-list .org-checkbox').length;
    if (arr.length === orgCount) arr = [];
    localStorage.setItem('org_filter_uids', JSON.stringify(arr));
    // applyOrgFilter(); // Убираем автоприменение
  });

  // Кнопка "Применить"
  $(document).on('click', '#org-filter-apply', function() {
    $('#org-filter-overlay').hide();
    applyOrgFilter();
    updateOrgFilterSelected();
    logUserAction('applyOrgFilter');
  });

  // Применение фильтра к сотрудникам
  window.applyOrgFilter = function() {
    let selectedArr = [];
    try {
      selectedArr = JSON.parse(localStorage.getItem('org_filter_uids') || '[]');
    } catch(e) { selectedArr = []; }
    let allOrgs = [];
    if (window.organizations) {
      allOrgs = window.organizations.filter(org => org.firm_uid).map(org => org.firm_uid);
      allOrgs.push(null); // для "Без организации"
    }
    // 1. Фильтрация сотрудников
    for (let w in WORKERS) {
      let worker = WORKERS[w];
      let no = Number(w) + 1;
      let id = no + '_' + worker['uid'];
      let $row = $('#' + id + '-row');
      let inUnassigned = $row.parents('.location-head').text().toUpperCase().includes('НЕРАСПРЕД') ||
                        $row.parents('.location-head').text().toUpperCase().includes('НЕСОТРУДНИК');
      let show = false;
      let workerFirm = (worker['firm_uid'] === null || worker['firm_uid'] === undefined) ? 'null' : worker['firm_uid'];
      // Мульти-фильтрация: показываем если firm_uid выбран
      if (
        (selectedArr.length === 0 || selectedArr.includes(workerFirm))
      ) {
        show = true;
      }
      // Если это НЕРАСПРЕДЕЛЁННЫЕ или НЕСОТРУДНИКИ, не трогаем их при отсутствии фильтра
      if (selectedArr.length === 0 && inUnassigned) {
        show = true;
      }
      if (show) {
        $('#' + id + '-row').show();
        $('#' + id + '-dv').show();
        $('#' + id + '-days-dv').show();
        $('#' + id + '-hours-dv').show();
      } else {
        $('#' + id + '-row').hide();
        $('#' + id + '-dv').hide();
        $('#' + id + '-days-dv').hide();
        $('#' + id + '-hours-dv').hide();
      }
    }
    // 2. Фильтрация location-head/master-head
    $('.location-head, .master-head, .chief-head').each(function() {
      let headId = $(this).attr('id');
      let canvasId = '#' + headId.replace('-head', '-canvas');
      // Показываем по умолчанию
      $(this).show();
      $(canvasId).show();
    });
    // Мастера: скрываем если у них canvas высота == 0
    $('.master-head').each(function() {
      let masterId = $(this).attr('id').replace('-head', '');
      let $canvas = $('#' + masterId + '-canvas');
      if ($canvas.height() == 0) {
        $(this).hide();
        $canvas.hide();
      }
    });
    // Шефы: скрываем если у них canvas высота == 0
    $('.chief-head').each(function() {
      let chiefId = $(this).attr('id').replace('-head', '');
      let $canvas = $('#' + chiefId + '-canvas');
      if ($canvas.height() == 0) {
        $(this).hide();
        $canvas.hide();
      }
    });
    // Локации: скрываем если у них canvas высота == 0
    $('.location-head').each(function() {
      let locId = $(this).attr('id').replace('-head', '');
      let $canvas = $('#' + locId + '-canvas');
      if ($canvas.height() == 0) {
        $(this).hide();
        $canvas.hide();
      }
    });
    // --- ДОБАВЛЕНО: разворачиваем "нераспределённых" полностью с вложенными ---
    let foundUnassigned = false;
    $('.location-head').each(function() {
        let text = $(this).text().toUpperCase();
        if (text.includes('НЕРАСПРЕД') || text.includes('НЕСОТРУДНИК')) {
            let id = $(this).attr('id').replace('-head', '');
            console.log('[applyOrgFilter] Найден нераспределённый блок:', id, $(this).text());
            // Разворачиваем сам location
            $('#'+id+'-canvas').show();
            $('#'+id+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
            $('#'+id+'-head').removeClass('collapsed');
            // Разворачиваем все вложенные canvases (chiefs, masters и т.д.)
            $('#'+id+'-canvas').find('[id$="-canvas"]').each(function() {
                $(this).show();
                let headId = $(this).attr('id').replace('-canvas', '-head');
                $('#'+headId+' .toggle-bt').css('background-image', 'url("/images/report/up.png")');
                $('#'+headId).removeClass('collapsed');
            });
            console.log('[applyOrgFilter] Развернул:', id, $('#'+id+'-canvas').is(':visible'), $('#'+id+'-head').hasClass('collapsed'));
            foundUnassigned = true;
        }
    });
    if (!foundUnassigned) {
        console.log('[applyOrgFilter] Не найдено ни одного блока нераспределённых!');
    }
  };

  // === Отображение выбранных фильтров организаций ===
  window.updateOrgFilterSelected = function() {
    let selectedArr = [];
    try {
      selectedArr = JSON.parse(localStorage.getItem('org_filter_uids') || '[]');
    } catch(e) { selectedArr = []; }
    let orgNames = [];
    let orgs = window.organizations ? window.organizations.filter(org => org.firm_uid).map(org => ({...org})) : [];
    orgs.push({ firm_uid: null, firm_name: 'Без организации' });
    if (selectedArr.length === 0) {
      orgNames = orgs.map(org => org.firm_name);
    } else {
      orgNames = orgs.filter(org => selectedArr.includes(org.firm_uid === null ? 'null' : org.firm_uid)).map(org => org.firm_name);
    }
    let parts = [];
    if (selectedArr.length === 0) {
      parts.push('Все организации');
    } else if (orgNames.length > 0) {
      parts.push(orgNames.join(', '));
    }
    $('#org-filter-selected').text(parts.length ? 'Фильтр: ' + parts.join(' + ') : '');
  };

  // Вызов при инициализации фильтра (например, после renderOrgFilter)
  if (window.organizations) updateOrgFilterSelected();

});



// === Режим только для чтения ===
let IS_READONLY = getCookie("READONLY") === "1";

// После загрузки страницы — визуальный индикатор
$(document).ready(function() {
  if (IS_READONLY) {
    // Надпись в шапке
    if ($('#readonly-indicator').length === 0) {
      $('#main-head').append('<div id="readonly-indicator" style="position:absolute;top:0;right:0;width:220px;height:32px;line-height:32px;background:#ffe0e0;color:#b00;font-size:18px;font-weight:bold;text-align:center;z-index:10;">Только для чтения</div>');
    }
    // Отключаем ввод поиска
    // Отключаем кнопки фильтра
    // Отключаем меню редактирования
    $('#context-menu').remove();
    $('#cell-menu').remove();
    // Отключаем добавление комментариев
    $('#add-comment-dv').remove();
    // Отключаем кнопки очистки/применения фильтра
    $('#filter-dv .filter-act-clear-bt').hide();
    $('#filter-dv .filter-act-apply-bt').hide();
    // Отключаем drag'n'drop, клики по ячейкам и т.д.
    $(document).off('mousedown');
    $(document).off('keydown');
    $(document).off('mouseup');
    $(document).off('mousemove');
    // Блокируем любые действия по изменению данных
    window.setCells = function(){};
    window.setComment = function(){};
    window.cellAction = function(){};
    window.contextAction = function(){};
    window.changeChief = function(){};
    window.changeMaster = function(){};
    window.clearFio = function(){};
    window.showHideInfo = function(){};
    window.startSelect = function(){};
    window.endSelect = function(){};
    window.selectCell = function(){};
    window.selectRow = function(){};
    window.selectCol = function(){};
    window.onRightClick = function(){};
    window.onDoubleClick = function(){};
    window.setCellVal = function(){};
    window.unselectCells = function(){};
    // Визуально делаем ячейки неактивными
    setTimeout(function(){
      $('.worker-row, .row-days-dv, .days-work, .days-weekend').css({'pointer-events':'none','opacity':0.7});
    }, 500);
    // Функция для навешивания обработчика скрытия info-dv
    function attachInfoDvHideHandler() {
        $(document).off('mousedown.hideInfoDv').on('mousedown.hideInfoDv', function(e) {
            if ($('#info-dv').is(':visible') && !$(e.target).closest('#info-dv').length && !$(e.target).hasClass('info-row')) {
                $('#info-dv').hide();
            }
        });
    }
    // Навешиваем обработчик при загрузке
    $(document).ready(function() {
        attachInfoDvHideHandler();
    });
  }
});


// === Сохранение и восстановление выделения ячеек при обновлении таблицы ===
let savedSelection = [];

function saveSelection() {
    savedSelection = selectedCells.map(cell => {
        let worker = WORKERS[cell.row];
        return {
            uid: worker ? worker.uid : null,
            col: cell.col
        };
    });
}

function restoreSelection() {
    selectedCells = [];
    savedSelection.forEach(sel => {
        let row = WORKERS.findIndex(w => w.uid === sel.uid);
        if (row !== -1) {
            let cell = {row: row, col: sel.col};
            selectedCells.push(cell);
            // Восстанавливаем подсветку
            $('#'+Number(row+1)+'-'+Number(sel.col+1)+'-day-dv').css("background", selectedBgd);
            $('#'+Number(row+1)+'-'+Number(sel.col+1)+'-day-dv').css("color", selectedFnt);
            $('#'+Number(row+1)+'number-row').css("background", selectedBgd);
            $('#0_'+Number(sel.col)+'-day-dv').css("background", selectedBgd);
        }
    });
}



// === Сохранение координат последней выделенной ячейки для автоскролла ===
function saveScrollCellToCookie() {
    if (selectedCells.length > 0) {
        let cell = selectedCells[0];
        let worker = WORKERS[cell.row];
        if (worker) {
            let obj = { uid: worker.uid, col: cell.col };
            document.cookie = "tabel_scroll_cell=" + encodeURIComponent(JSON.stringify(obj)) + ";path=/;max-age=2592000";
        }
    }
}

function scrollToCellFromCookie() {
    let matches = document.cookie.match(/(?:^|; )tabel_scroll_cell=([^;]*)/);
    if (matches) {
        try {
            let obj = JSON.parse(decodeURIComponent(matches[1]));
            let row = WORKERS.findIndex(w => w.uid === obj.uid);
            if (row !== -1) {
                let id = Number(row+1)+'-'+Number(obj.col+1)+'-day-dv';
                let cell = document.getElementById(id);
                console.log('Пробую скроллить к:', id, cell ? 1 : 0);
                if (cell) {
                    cell.scrollIntoView({behavior: 'smooth', block: 'center'});
                    cell.classList.add('scroll-highlight');
                    setTimeout(() => cell.classList.remove('scroll-highlight'), 1200);
                }
            }
        } catch(e) {console.log('Ошибка scrollToCellFromCookie', e);}
    }
}



// Сохраняем позицию прокрутки окна
$(window).on('scroll', function() {
    localStorage.setItem('tabel_scroll_top', window.scrollY || window.pageYOffset);
});

// После построения таблицы и применения фильтра восстанавливаем scrollTop
function restoreScrollPosition() {
    setTimeout(function() {
        let scrollTop = localStorage.getItem('tabel_scroll_top');
        console.log('Восстанавливаю scrollTop:', scrollTop, 'document.body.scrollHeight:', document.body.scrollHeight);
        if (scrollTop !== null) {
            window.scrollTo(0, parseInt(scrollTop, 10));
        }
    }, 1200); // увеличенная задержка
}


// Сохраняем последнюю активную ячейку
function saveLastCellToStorage() {
    if (selectedCells.length > 0) {
        let cell = selectedCells[0];
        let worker = WORKERS[cell.row];
        if (worker) {
            let obj = { uid: worker.uid, col: cell.col };
            localStorage.setItem('tabel_last_cell', JSON.stringify(obj));
        }
    }
}

// Вызовите saveLastCellToStorage() в конце selectCell, selectRow, selectCol, selectRectangle, unselectCells
// Например, после saveScrollCellToCookie();

// Восстанавливаем позицию: если ячейка есть — скроллим к ней, иначе scrollTop
function restoreLastCellOrScroll() {
    setTimeout(function() {
        let lastCell = localStorage.getItem('tabel_last_cell');
        if (lastCell) {
            try {
                let obj = JSON.parse(lastCell);
                let row = WORKERS.findIndex(w => w.uid === obj.uid);
                if (row !== -1) {
                    let id = Number(row+1)+'-'+Number(obj.col+1)+'-day-dv';
                    let cell = document.getElementById(id);
                    if (cell) {
                        cell.scrollIntoView({behavior: 'smooth', block: 'center'});
                        cell.classList.add('scroll-highlight');
                        setTimeout(() => cell.classList.remove('scroll-highlight'), 1200);
                        return;
                    }
                }
            } catch(e) {}
        }
        // Если не удалось — fallback на scrollTop
        let scrollTop = localStorage.getItem('tabel_scroll_top');
        console.log('Восстанавливаю scrollTop:', scrollTop, 'document.body.scrollHeight:', document.body.scrollHeight);
        if (scrollTop !== null) {
            window.scrollTo(0, parseInt(scrollTop, 10));
        }
    }, 1200);
}

// Вызовите restoreLastCellOrScroll() в самом конце после построения таблицы и фильтрации
// Вместо restoreScrollPosition()


function checkSelectedCellVisibility() {
    if (selectedCells.length > 0) {
        let cell = selectedCells[0];
        let selector = '#'+Number(cell.row+1)+'-'+Number(cell.col+1)+'-day-dv';
        if (!isCellVisible(selector)) {
            unselectCells();
        }
    }
}

// Проверка при скролле окна
$(window).on('scroll', function() {
    checkSelectedCellVisibility();
});

// После фильтрации, свертывания и т.д. вызывайте checkSelectedCellVisibility()
// Например, в applyOrgFilter, rollAll, slideDiv — в конце:
// checkSelectedCellVisibility();

function isCellTrulyVisible(cellSelector) {
    const $cell = $(cellSelector);
    if ($cell.length === 0) return false;
    if (!$cell.is(':visible')) return false;
    const rect = $cell[0].getBoundingClientRect();
    return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth)
    );
}




// === Режим выделения строки только для просмотра (read-only) ===
console.log('report.js debug: read-only режим по фамилии активен');
let isReadOnlyRowSelected = false;
let readOnlyRowIndex = -1;
let readOnlyRowNum = null;



function initReadOnlyHandlers() {
    // Клик по фамилии — только read-only выделение, обычное выделение по фамилии запрещено
    $(document).off('click.readonlyrow').on('click.readonlyrow', '.worker_lb', function(e) {
        let id = $(this).attr('id');
        let match = id && id.match(/^([0-9]+)_/);
        console.log('[DEBUG] Клик по фамилии', {id, match, isReadOnlyRowSelected, readOnlyRowIndex});
        if (match) {
            let rowIndex = parseInt(match[1], 10) - 1;
            console.log('[DEBUG] rowIndex:', rowIndex, 'isReadOnlyRowSelected:', isReadOnlyRowSelected, 'readOnlyRowIndex:', readOnlyRowIndex);
            if (!(isReadOnlyRowSelected && readOnlyRowIndex === rowIndex)) {
                isReadOnlyRowSelected = true;
                readOnlyRowIndex = rowIndex;
                // --- ДОБАВЛЕНО: определяем и сохраняем rowNum ---
                let rowNum = null;
                let $workerRow = $(this).closest('.worker-row, .row-days-dv');
                if ($workerRow.length > 0) {
                    let id = $workerRow.attr('id');
                    let matchNum = id && id.match(/^([0-9]+)_/);
                    if (matchNum) {
                        rowNum = parseInt(matchNum[1], 10);
                    }
                }
                readOnlyRowNum = rowNum;
                // --- конец добавления ---
                console.log('[DEBUG] Выделяю строку', rowIndex);
                selectRow(rowIndex, true); // true — readOnly
                // Снимаем выделение со всех
                $('.worker-row, .row-days-dv, .number-row').removeClass('readonly-row-selected');
                // Добавляем только нужным элементам по id
                let worker = WORKERS[rowIndex];
                if (worker) {
                    let rowId = (rowNum !== null ? rowNum : (rowIndex+1))+'_'+worker.uid+'-row';
                    let dvId = (rowNum !== null ? rowNum : (rowIndex+1))+'_'+worker.uid+'-dv';
                    let numId = (rowNum !== null ? rowNum : (rowIndex+1))+'number-row';
                    $('#'+rowId).addClass('readonly-row-selected');
                    $('#'+dvId).addClass('readonly-row-selected');
                    $('#'+numId).addClass('readonly-row-selected');
                }
            } else {
                console.log('[DEBUG] Повторный клик по той же строке, ничего не делаю');
            }
        } else {
            console.log('[DEBUG] Не удалось распарсить id');
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    });

    // Дабл-клик по фамилии — полностью игнорируем
    $(document).off('dblclick.readonlyrow').on('dblclick.readonlyrow', '.worker_lb', function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
    });

    // Глобальный клик по документу — если не по .worker_lb, сбрасываем read-only выделение и инициируем обычное выделение
    $(document).off('mousedown.readonlyrow').on('mousedown.readonlyrow', function(e) {
        if (!$(e.target).closest('.worker_lb').length && isReadOnlyRowSelected) {
            // Если клик по ячейке внутри строки — обработает отдельный обработчик ниже
            let $cell = $(e.target).closest('[id$="-day-dv"]');
            if ($cell.length) {
                let id = $cell.attr('id');
                let match = id && id.match(/^([0-9]+)-([0-9]+)-day-dv$/);
                if (match) {
                    let row = parseInt(match[1], 10) - 1;
                    if (row === readOnlyRowIndex) return;
                }
            }
            clearReadOnlyRowSelection();
            // Если клик по ячейке — инициируем обычное выделение
            if ($cell.length) {
                let id = $cell.attr('id');
                let match = id && id.match(/^([0-9]+)-([0-9]+)-day-dv$/);
                if (match) {
                    let row = parseInt(match[1], 10) - 1;
                    let col = parseInt(match[2], 10) - 1;
                    console.log('[LOG] mousedown: программный вызов selectCell', {row, col});
                    selectCell(row, col, null);
                }
            }
            // Если клик по номеру строки
            let $row = $(e.target).closest('.number-row');
            if ($row.length) {
                let row = parseInt($row.attr('id'), 10) - 1;
                if (!isNaN(row)) {
                    selectRow(row);
                }
            }
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    });
}

// Клик по ячейке внутри read-only строки — снимает read-only и выделяет только эту ячейку (навешивается только один раз)
if (!window._readonly_rowcell_handler_attached) {
    $(document).on('mousedown.readonlyrowcell', '[id$="-day-dv"]', function(e) {
        let id = $(this).attr('id');
        let match = id && id.match(/^([0-9]+)-([0-9]+)-day-dv$/);
        if (match) {
            let row = parseInt(match[1], 10) - 1;
            let col = parseInt(match[2], 10) - 1;
            if (isReadOnlyRowSelected && row === readOnlyRowIndex) {
                console.log('[DEBUG] mousedown: снимаю read-only и выделяю ячейку', {row, col});
                clearReadOnlyRowSelection();
                if (!(e.ctrlKey || e.shiftKey || e.metaKey)) {
                    unselectCells();
                    console.log('[LOG] mousedown: программный вызов selectCell', {row, col});
                    selectCell(row, col, null);
                }
                e.stopPropagation();
                e.preventDefault();
                return false;
            } else if (!isReadOnlyRowSelected) {
                // Если уже не read-only, но клик по ячейке — всегда снимаем выделение и выделяем её заново
                if (!(e.ctrlKey || e.shiftKey || e.metaKey)) {
                    unselectCells();
                    console.log('[LOG] mousedown: программный вызов selectCell', {row, col});
                    selectCell(row, col, null);
                }
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        }
    });
    window._readonly_rowcell_handler_attached = true;
}

function clearReadOnlyRowSelection() {
    if (isReadOnlyRowSelected) {
        console.log('[DEBUG] clearReadOnlyRowSelection: снимаю read-only', {row: readOnlyRowIndex, rowNum: readOnlyRowNum});
        let row = readOnlyRowIndex;
        let rowNum = readOnlyRowNum; // <--- ДОБАВИТЬ!
        isReadOnlyRowSelected = false;
        readOnlyRowIndex = -1;
        readOnlyRowNum = null; // <--- ДОБАВИТЬ!
        // Снимаем выделение только с нужных элементов
        let worker = WORKERS[row];
        if (worker && rowNum !== null) {
            let rowId = rowNum + '_' + worker.uid + '-row';
            let dvId = rowNum + '_' + worker.uid + '-dv';
            let numId = rowNum + 'number-row';
            $('#'+rowId).removeClass('readonly-row-selected');
            $('#'+dvId).removeClass('readonly-row-selected');
            $('#'+numId).removeClass('readonly-row-selected');
            // Восстанавливаем стили ячеек строки
            for (let j in DAYS) {
                let col_no = Number(j) + 1;
                let cellId = rowNum + '-' + col_no + '-day-dv';
                let $cell = $('#' + cellId);
                // ВОССТАНАВЛИВАЕМ inline-стиль background, если был сохранён
                if ($cell.data('oldBg') !== undefined) {
                    $cell[0].style.background = $cell.data('oldBg');
                    $cell.removeData('oldBg');
                }
                let dayType = DAYS[j]['weekend'] ? 'weekend' : 'work';
                $cell.removeClass('readonly-row-selected');
                $cell.removeClass('days-work days-weekend');
                $cell.addClass('days-' + dayType);
                // Восстанавливаем фон (на случай, если не было inline-стиля)
                if (dayType === 'weekend') {
                    $cell.css({"background": weekendBgd, "color": unselectedFnt});
                } else {
                    $cell.css({"background": unselectedBgd, "color": unselectedFnt});
                }
                // === ЛОГИ ===
                console.log('[clearReadOnlyRowSelection][ROW DEBUG]', {
                    row,
                    col_no,
                    cellId,
                    cellElem: $cell[0],
                    restoredBg: $cell[0] ? $cell[0].style.background : undefined,
                    classes: $cell.attr('class'),
                    visible: $cell.is(':visible')
                });
            }
            $('#'+numId).css("background", unselectedNoBgd);
        }
    }
}

// Переопределяем selectRow/selectCell/startSelect: если клик по фамилии — ничего не делаем
let orig_selectRow = selectRow;
selectRow = function(indexRow, readOnlyFlag) {
    if (readOnlyFlag === true) {
        return orig_selectRow.apply(this, arguments);
    }
    if (event && $(event.target).closest('.worker_lb').length) {
        return false;
    }
    return orig_selectRow.apply(this, arguments);
};
let orig_selectCell = selectCell;
selectCell = function(indexRow, indexCol, event) {
    console.log('[DEBUG] selectCell вызван', {isReadOnlyRowSelected, indexRow, indexCol, event});
    if (isReadOnlyRowSelected) {
        console.log('[DEBUG] selectCell: снимаю read-only');
        clearReadOnlyRowSelection();
    }
    return orig_selectCell.apply(this, arguments);
};
let orig_startSelect = startSelect;
startSelect = function(indexRow, indexCol, event) {
    console.log('[DEBUG] startSelect вызван', {isReadOnlyRowSelected, indexRow, indexCol, event});
    if (isReadOnlyRowSelected) {
        console.log('[DEBUG] startSelect: снимаю read-only');
        clearReadOnlyRowSelection();
    }
    return orig_startSelect.apply(this, arguments);
};

// В начало функций редактирования — запрет если read-only выделение
let orig_setCells = setCells;
setCells = function(value, isComment=false, isFullClear=false) {
  // Блокируем одиночную букву 'М' (русскую или английскую)
  if (!isComment && !isFullClear && (value === 'М' || value === 'M')) {
    return;
  }
  return orig_setCells.apply(this, arguments);
};
let orig_setComment = setComment;
setComment = function() { if (isReadOnlyRowSelected) return; return orig_setComment.apply(this, arguments); };
let orig_cellAction = cellAction;
cellAction = function() { if (isReadOnlyRowSelected) return; return orig_cellAction.apply(this, arguments); };
let orig_contextAction = contextAction;
contextAction = function() { if (isReadOnlyRowSelected) return; return orig_contextAction.apply(this, arguments); };

// Вызов обработчиков после построения таблицы и автообновления
document.addEventListener('DOMContentLoaded', initReadOnlyHandlers);
if (typeof createTabel === 'function') {
    let orig_createTabel = createTabel;
    createTabel = function() {
        let res = orig_createTabel.apply(this, arguments);
        initReadOnlyHandlers();
        return res;
    };
}
if (typeof getDataTabel === 'function') {
    let orig_getDataTabel = getDataTabel;
    getDataTabel = function() {
        let res = orig_getDataTabel.apply(this, arguments);
        initReadOnlyHandlers();
        return res;
    };
}


// === Проверка размера окна для табеля ===
function checkTabelWindowSize() {
  var minWidth = 500;
  var minHeight = 300;
  if (window.innerWidth < minWidth || window.innerHeight < minHeight) {
    if ($('#tabel-size-warning').length === 0) {
      $('body').append('<div id="tabel-size-warning" style="position:fixed;z-index:99999;top:0;left:0;width:100vw;height:100vh;background:rgba(255,255,255,0.97);display:flex;align-items:center;justify-content:center;font-size:2.2em;color:#b00;text-align:center;"><div><b>Размер окна слишком маленький для корректного отображения табеля.<br>Пожалуйста, увеличьте размер окна.</b></div></div>');
    } else {
      $('#tabel-size-warning').show();
    }
    $('#head, #table, #sticky').hide();
  } else {
    $('#tabel-size-warning').hide();
    $('#head, #table, #sticky').css('display', '');
  }
}

$(document).ready(function() {
  checkTabelWindowSize();
  $(window).on('resize', checkTabelWindowSize);
});



window.tabelIsSaving = false;

// Модифицируем sendDataTabel для блокировки
let orig_sendDataTabel = sendDataTabel;
sendDataTabel = async function(full=true) {
  window.tabelIsSaving = true;
  try {
    await orig_sendDataTabel.apply(this, arguments);
  } finally {
    window.tabelIsSaving = false;
  }
};

// Вспомогательная функция для показа уведомления
function showSavingAlert() {
  if ($('#tabel-saving-alert').length === 0) {
    $('body').append('<div id="tabel-saving-alert" style="position:fixed;z-index:99999;top:40px;right:40px;background:#ffe0e0;color:#b00;padding:18px 32px;border-radius:8px;box-shadow:0 2px 8px #0002;font-size:20px;display:none;">Пожалуйста, дождитесь сохранения данных...</div>');
  }
  $('#tabel-saving-alert').stop(true, true).fadeIn(200).delay(1200).fadeOut(400);
}

// Блокируем ввод, если идет сохранение
let orig_setCells2 = setCells;
setCells = function(value, isComment=false, isFullClear=false) {
  if (isReadOnlyRowSelected) return; // read-only строка — запретить редактирование
  if (window.tabelIsSaving) {
    showSavingAlert();
    return;
  }
  return orig_setCells2.apply(this, arguments);
};
let orig_setComment2 = setComment;
setComment = function() {
  if (isReadOnlyRowSelected) return;
  if (window.tabelIsSaving) {
    showSavingAlert();
    return;
  }
  return orig_setComment2.apply(this, arguments);
};
let orig_cellAction2 = cellAction;
cellAction = function() {
  if (isReadOnlyRowSelected) return;
  if (window.tabelIsSaving) {
    showSavingAlert();
    return;
  }
  return orig_cellAction2.apply(this, arguments);
};
let orig_contextAction2 = contextAction;
contextAction = function() {
  if (isReadOnlyRowSelected) return;
  if (window.tabelIsSaving) {
    showSavingAlert();
    return;
  }
  return orig_contextAction2.apply(this, arguments);
};


function getTodayYMD() {
  // Получаем дату из URL или из текущей даты
  let urlParams = new URLSearchParams(window.location.search);
  let dateParam = urlParams.get('date');
  let viewDate = dateParam ? new Date(dateParam) : new Date();
  
  // Учитываем часовой пояс
  let offset = -(viewDate.getTimezoneOffset()) / 60;
  if(offset != 10) {
    viewDate = new Date(viewDate.getTime() + ((10-offset)*60*60*1000));
  }
  
  // Проверяем, является ли просматриваемый месяц прошлым
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let viewMonth = viewDate.getMonth();
  let viewYear = viewDate.getFullYear();
  
  // Если месяц в URL отличается от текущего месяца, считаем его прошлым
  let isPastMonth = viewMonth !== currentMonth || viewYear !== currentYear;
  
  let date;
  if (isPastMonth) {
    // Если просматриваем прошлый месяц, используем последний день этого месяца
    let lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    date = new Date(viewYear, viewMonth, lastDay);
  } else {
    date = viewDate;
  }
  
  const pad = n => n < 10 ? '0'+n : n;
  return date.getFullYear() + pad(date.getMonth()+1) + pad(date.getDate());
}

function getReportUrl(groupby, type) {
    // SID, UID всегда брать из куков
    let sid = getCookie('SID') || '';
    let uid = getCookie('UID') || '';
    
    // Получаем дату из URL или из текущей даты
    let urlParams = new URLSearchParams(window.location.search);
    let dateParam = urlParams.get('date');
    console.log('[getReportUrl] Исходная дата из URL:', dateParam);
    
    let date;
    if (dateParam) {
      // Разбираем дату из URL (формат YYYYMMDD)
      let year = parseInt(dateParam.substring(0, 4));
      let month = parseInt(dateParam.substring(4, 6)) - 1; // месяцы в JS начинаются с 0
  
      // Проверяем, выбран ли текущий месяц
      let now = new Date();
      let isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
  
      if (isCurrentMonth) {
        // Если выбран текущий месяц — удаляем куку
        delCookie('LAST_DAY_OF_MONTH');
        // Используем сегодняшнюю дату
        date = getTodayYMD();
      } else {
        // Проверяем наличие даты в куке LAST_DAY_OF_MONTH
        let lastDayDate = getCookie('LAST_DAY_OF_MONTH');
        if (lastDayDate) {
          date = lastDayDate;
          console.log('[getReportUrl] Используем дату из куки LAST_DAY_OF_MONTH:', date);
        } else {
          // Если куки нет, используем последний день месяца
          let lastDay = new Date(year, month + 1, 0).getDate();
          date = `${year}${String(month + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
          console.log('[getReportUrl] Используем последний день месяца:', date);
        }
      }
    } else {
      // Если нет даты в URL, проверяем куку LAST_DAY_OF_MONTH
      let lastDayDate = getCookie('LAST_DAY_OF_MONTH');
      if (lastDayDate) {
        date = lastDayDate;
        console.log('[getReportUrl] Используем дату из куки LAST_DAY_OF_MONTH:', date);
      } else {
        date = getTodayYMD();
        console.log('[getReportUrl] Используем текущую дату:', date);
      }
    }
    
    let url = `https://1c.ooo-kem.ru:8443/kem-zup/hs/rc/?sid=${encodeURIComponent(sid)}&user=${encodeURIComponent(uid)}&date=${date}&method=getTable&groupby=${groupby}&type=${type}`;
    console.log('[getReportUrl] Итоговый URL:', url);
    return url;
}


function getReportFileName(groupby, type) {
    let urlParams = new URLSearchParams(window.location.search);
    let dateParam = urlParams.get('date');
    let dateStr;
  
    if (dateParam) {
      // Разбираем дату из URL (формат YYYYMMDD)
      let year = parseInt(dateParam.substring(0, 4));
      let month = parseInt(dateParam.substring(4, 6)) - 1; // месяцы в JS начинаются с 0
      
      // Проверяем, выбран ли текущий месяц
      let now = new Date();
      let isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
      
      if (isCurrentMonth) {
        // Если выбран текущий месяц, используем текущую дату
        const today = new Date();
        const pad = n => n < 10 ? '0'+n : n;
        dateStr = pad(today.getDate()) + '.' + pad(today.getMonth()+1) + '.' + today.getFullYear();
      } else {
        // Проверяем наличие даты в куке LAST_DAY_OF_MONTH
        let lastDayDate = getCookie('LAST_DAY_OF_MONTH');
        if (lastDayDate) {
          // Форматируем дату из куки (формат YYYYMMDDHHMMSS)
          let year = parseInt(lastDayDate.substring(0, 4));
          let month = parseInt(lastDayDate.substring(4, 6));
          let day = parseInt(lastDayDate.substring(6, 8));
          dateStr = `${day}.${month}.${year}`;
        } else {
          // Если куки нет, используем последний день месяца
          let lastDay = new Date(year, month + 1, 0).getDate();
          dateStr = `${lastDay}.${month + 1}.${year}`;
        }
      }
    } else {
      // Если нет даты в URL, проверяем куку LAST_DAY_OF_MONTH
      let lastDayDate = getCookie('LAST_DAY_OF_MONTH');
      if (lastDayDate) {
        // Форматируем дату из куки (формат YYYYMMDDHHMMSS)
        let year = parseInt(lastDayDate.substring(0, 4));
        let month = parseInt(lastDayDate.substring(4, 6));
        let day = parseInt(lastDayDate.substring(6, 8));
        dateStr = `${day}.${month}.${year}`;
      } else {
        // Если куки нет, используем текущую дату
        const today = new Date();
        const pad = n => n < 10 ? '0'+n : n;
        dateStr = pad(today.getDate()) + '.' + pad(today.getMonth()+1) + '.' + today.getFullYear();
      }
    }
  
    let base = '';
    if (groupby === 'masters') base = 'Табель с группировкой по мастерам';
    else if (groupby === 'firms') base = 'Табель с группировкой по организациям';
    else if (groupby === 'locations') base = 'Табель с группировкой по объектам';
    else base = 'Табель';
    return `${base} от ${dateStr}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
}

// --- Новый обработчик для скачивания отчёта с авторизацией ---
async function downloadReportWithAuth(groupby, type, period) {
    let url = getReportUrl(groupby, type, period);
  let authHeader = getAuthHeaderForReport();
  if (typeof period !== 'undefined') {
    url += '&period=' + period;
}
  if (!authHeader) {
    alert('Не найден заголовок авторизации. Повторите вход.');
    return;
  }
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    if (!response.ok) {
      throw new Error('Ошибка загрузки отчёта: ' + response.status);
    }
    const blob = await response.blob();
    let fileName = getReportFileName(groupby, type);
    // Для IE/Edge
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, fileName);
      showReportSpinner(false);
  } else {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(link.href);
        link.remove();
        showReportSpinner(false);
      }, 2000);
    }
  } catch (e) {
    alert('Ошибка при получении отчёта: ' + e.message);
    showReportSpinner(false);
  }
}

$(document).off('click.reportDownload').on('click.reportDownload', '#report-pdf-btn, #report-xlsx-btn', function() {
  let groupby = $("input[name='report-groupby']:checked").val();
  let type = $(this).attr('id') === 'report-pdf-btn' ? 'pdf' : 'xlsx';
  downloadReportWithAuth(groupby, type);
  $('#reports-modal').fadeOut(120);
  logUserAction('downloadReport', { type: type });
});
// Показ/скрытие спиннера загрузки отчёта
function showReportSpinner(show) {
  if (show) {
    $('#reports-modal-spinner').css('display', 'flex');
  } else {
    $('#reports-modal-spinner').css('display', 'none');
  }
}



// === Универсальная функция логирования действий пользователя ===
/*
function logUserAction(action, details = {}) {
  try {
    const fio = getCookie('LABEL') || getCookie('UID') || 'unknown';
    const payload = {
      fio,
      action,
      details,
      url: location.pathname,
      datetime: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    fetch('https://t2.ooo-kem.ru:8383/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) { /* ignore */ 



// === Встраиваем логирование в основные действия ===

// 1. Изменение ячейки (setCells)
let orig_setCells_log = setCells;
setCells = function(value, isComment=false, isFullClear=false) {

    if (
        typeof value === 'string' &&
        /^F([1-9]|1[0-2])$/.test(value)
    ) {
        return;
    }

    if (
        (typeof value === 'string' && value === '') &&
        window.lastKeyCode && window.lastKeyCode >= 112 && window.lastKeyCode <= 123
    ) {
        return;
    }
  if (!isComment && !isFullClear) {
    for (let cell of selectedCells) {
      let worker = WORKERS[cell.row] || {};
      // logUserAction('setCell', {
      //   fio: worker.fio,
      //   uid: worker.uid,
      //   row: cell.row,
      //   col: cell.col,
      //   value
      // });
    }
  }


  return orig_setCells_log.apply(this, arguments);
};

// 2. Кнопки меню ячейки (cellAction)
let orig_cellAction_log = cellAction;
cellAction = function(vt) {
  let cell = selectedCells[0] || {};
  let worker = WORKERS[cell.row] || {};
  // logUserAction('cellAction', {
  //   fio: worker.fio,
  //   uid: worker.uid,
  //   row: cell.row,
  //   col: cell.col,
  //   vt
  // });
  return orig_cellAction_log.apply(this, arguments);
};

// 3. Контекстное меню (contextAction)
let orig_contextAction_log = contextAction;
contextAction = function(act) {
  let cell = selectedCells[0] || {};
  let worker = WORKERS[cell.row] || {};
  // logUserAction('contextAction', {
  //   fio: worker.fio,
  //   uid: worker.uid,
  //   row: cell.row,
  //   col: cell.col,
  //   act
  // });
  return orig_contextAction_log.apply(this, arguments);
};

// 4. Фильтры (changeFilter)
let orig_changeFilter_log = changeFilter;
changeFilter = function(type) {
  // logUserAction('changeFilter', { type });
  return orig_changeFilter_log.apply(this, arguments);
};

// 5. Выделение ячейки (selectCell)
let orig_selectCell_log = selectCell;
selectCell = function(indexRow, indexCol, event) {
  let worker = WORKERS[indexRow] || {};
  // logUserAction('selectCell', {
  //   fio: worker.fio,
  //   uid: worker.uid,
  //   row: indexRow,
  //   col: indexCol,
  //   shiftSelection
  // });
  return orig_selectCell_log.apply(this, arguments);
};

// 6. Открытие/закрытие модального окна отчёта
$(document).on('click', '#menu-reports', function() {
  // logUserAction('openReportsModal');
});
$(document).on('click', '#reports-modal-close', function() {
  // logUserAction('closeReportsModal');
});
$(document).on('click', '#report-pdf-btn', function() {
  // logUserAction('downloadReport', { type: 'pdf' });
});
$(document).on('click', '#report-xlsx-btn', function() {
  // logUserAction('downloadReport', { type: 'xlsx' });
});

// 7. Применение фильтра организаций
$(document).on('click', '#org-filter-apply', function() {
  // logUserAction('applyOrgFilter');
});

// 8. Логирование удаления (очистки) ячейки
let orig_showConfirmClearModal = showConfirmClearModal;
showConfirmClearModal = function(onConfirm) {
  // logUserAction('showConfirmClearModal');
  return orig_showConfirmClearModal.call(this, function() {
    // logUserAction('cellClearConfirmed');
    if (typeof onConfirm === 'function') onConfirm();
  });
};

// 9. Логирование нажатий по всем кнопкам
$(document).on('click', 'button, .btn, .filter-act-clear-bt, .filter-act-apply-bt, .toggle-bt, input[type=button], input[type=submit]', function(e) {
  let $btn = $(this);
  // logUserAction('buttonClick', {
  //   text: $btn.text() || $btn.val() || '',
  //   id: $btn.attr('id') || '',
  //   class: $btn.attr('class') || '',
  //   name: $btn.attr('name') || '',
  //   value: $btn.val() || '',
  //   tag: this.tagName
  // });
});

// 10. Логирование нажатий клавиш на клавиатуре
$(document).on('keydown', function(e) {
    // Блокировка функциональных клавиш F1-F12
    if (e.keyCode >= 112 && e.keyCode <= 123 || e.key.startsWith('F')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

// Дополнительная блокировка функциональных клавиш
window.addEventListener('keydown', function(e) {
    if (e.keyCode >= 112 && e.keyCode <= 123 || e.key.startsWith('F')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

document.addEventListener('keydown', function(e) {
    if (e.keyCode >= 112 && e.keyCode <= 123 || e.key.startsWith('F')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

// В setCells и startSelect запретить редактирование cell-before-ob
let orig_setCells3 = setCells;
setCells = function(value, isComment=false, isFullClear=false) {
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        let $cell = $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv');
        if ($cell.hasClass('cell-before-ob')) {
            return; // Блокируем редактирование
        }
    }
    return orig_setCells3.apply(this, arguments);
};
let orig_startSelect3 = startSelect;
startSelect = function(indexRow, indexCol, event) {
    let $cell = $('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv');
    if ($cell.hasClass('cell-before-ob')) {
        return; // Блокируем выделение
    }
    return orig_startSelect3.apply(this, arguments);
};


// --- Функция для преобразования даты приёма из строки '17 мая 2022 г.' в YYYYMMDD ---
function parseDateIn(dateIn) {
    let months = {
        'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
        'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
    };
    let match = String(dateIn).match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
    if (match) {
        let day = ('0' + match[1]).slice(-2);
        let month = months[match[2].toLowerCase()] || '01';
        let year = match[3];
        return year + month + day;
    }
    return '';
}


let orig_setCells_cellBeforeIn = setCells;
setCells = function(value, isComment=false, isFullClear=false) {
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        let $cell = $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv');
        if ($cell.hasClass('cell-before-in')) {
            // Разрешаем только часы от 1 до 25 или удаление (пусто/0)
            let uid = WORKERS[Number(cell['row'])]['uid'];
            let day = Number(cell['col']);
            let no = Number(cell['row'])+1;
            let id = no+'_'+uid;
            if (value === '' || value === 0 || value === '0') {
                // Удаление значения
                TABEL[id][day]['vt'] = '';
                TABEL[id][day]['hours'] = 0;
                // Очищаем отображение
                let htmlValue = '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-hours" class="days-hours"></div>';
                htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment" class="days-comment" title="'+TABEL[id][day]['comment']+'"></div>';
                $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html(htmlValue);
                $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": selectedFnt, "font-weight": "normal"});
                // Фиксируем изменение для отправки на сервер
                if (!changedCells[id]) changedCells[id] = {};
                changedCells[id][day] = TABEL[id][day];
                TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
                return;
            }
            let num = Number(value);
            if (!/^[0-9]+$/.test(value) || num < 1 || num > 25) {
                return; // Блокируем всё, кроме чисел 1-25 и удаления
            }
            // Принудительно ставим Я и часы
            value = num;
            // Устанавливаем только часы, vt = 'Я'
            TABEL[id][day]['vt'] = 'Я';
            TABEL[id][day]['hours'] = num;
            // Обновляем отображение
            let htmlValue = '<span class="cell-code-small">Я</span><span class="cell-hours-big">'+num+'</span>';
            htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment" class="days-comment" title="'+TABEL[id][day]['comment']+'"></div>';
            $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html(htmlValue);
            $('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": selectedFnt, "font-weight": "normal"});
            // Фиксируем изменение для отправки на сервер
            if (!changedCells[id]) changedCells[id] = {};
            changedCells[id][day] = TABEL[id][day];
            TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
            return;
        }
    }
    return orig_setCells_cellBeforeIn.apply(this, arguments);
};


// === Tooltip для фиксированных ячеек с doc ===
$(document).on('mouseenter', '[data-fixed="1"]', function(e) {
    let doc = $(this).attr('data-doc');
    if (doc) {
        let $tooltip = $('#fixstate-tooltip');
        if ($tooltip.length === 0) {
            $('body').append('<div id="fixstate-tooltip" style="position:absolute;z-index:99999;max-width:400px;background:#fffbe6;border:1px solid #e6b800;padding:10px 16px;border-radius:7px;box-shadow:0 2px 8px #0002;font-size:15px;display:none;"></div>');
            $tooltip = $('#fixstate-tooltip');
        }
        $tooltip.html('<b>Документ:</b><br>' + doc.replace(/\n/g, '<br>'));
        let offset = $(this).offset();
        let tooltipH = $tooltip.outerHeight();
        let tooltipW = $tooltip.outerWidth();
        let cellH = $(this).outerHeight();
        let cellW = $(this).outerWidth();
        let winH = $(window).height();
        let winW = $(window).width();
        let top = offset.top - tooltipH - 8; // по умолчанию — сверху
        let left = offset.left;
        // Если не влезает сверху — показываем снизу
        if (top < 10) {
            top = offset.top + cellH + 8;
        }
        // Если не влезает справа — сдвигаем влево
        if (left + tooltipW > winW - 10) {
            left = winW - tooltipW - 10;
        }
        if (left < 10) left = 10;
        // Если открыто контекстное меню — tooltip выше него
        let $ctx = $('#context-menu:visible');
        if ($ctx.length) {
            let ctxOffset = $ctx.offset();
            let ctxH = $ctx.outerHeight();
            // Если tooltip может перекрыть меню — поднимаем выше
            if (top + tooltipH > ctxOffset.top && top < ctxOffset.top + ctxH) {
                top = ctxOffset.top - tooltipH - 8;
                if (top < 10) top = 10;
            }
        }
        $tooltip.css({
            top: top + 'px',
            left: left + 'px',
            display: 'block'
        });
    }
});
$(document).on('mouseleave', '[data-fixed="1"]', function() {
    $('#fixstate-tooltip').hide();
});



    // --- ЯВНО показываем head/canvas для "НЕРАСПРЕДЕЛЕННЫЕ", если внутри есть хотя бы один видимый сотрудник ---
    $('.location-head').each(function() {
        let text = $(this).text().toUpperCase();
        if (text.includes('НЕРАСПРЕД') || text.includes('НЕСОТРУДНИК')) {
            let id = $(this).attr('id').replace('-head', '');
            let hasVisible = $('#'+id+'-canvas .worker-row:visible').length > 0;
            if (hasVisible) {
                $(this).show();
                $('#'+id+'-canvas').show();
            }
        }
    });



    // --- Гарантируем, что head "НЕРАСПРЕДЕЛЕННЫЕ" показывается, если есть видимые сотрудники ---
    $('.location-head').each(function() {
        let text = $(this).text().toUpperCase();
        if (text.includes('НЕРАСПРЕД') || text.includes('НЕСОТРУДНИК')) {
            let id = $(this).attr('id').replace('-head', '');
            let hasVisible = $('#'+id+'-canvas .worker-row:visible').length > 0;
            if (hasVisible) {
                $(this).css('display', 'flex'); // Явно flex, чтобы не было display: none
                $('#'+id+'-canvas').show();
    } else {
                $(this).hide();
                $('#'+id+'-canvas').hide();
            }
        }
    });

    
    // --- ЯВНО показываем master-head и chief-head внутри "НЕРАСПРЕДЕЛЕННЫЕ", если есть видимые сотрудники ---
    $('.location-head').each(function() {
        let text = $(this).text().toUpperCase();
        if (text.includes('НЕРАСПРЕД') || text.includes('НЕСОТРУДНИК')) {
            let id = $(this).attr('id').replace('-head', '');
            // Для каждого master-head внутри этого location
            $('#'+id+'-canvas .master-head').each(function() {
                let masterId = $(this).attr('id').replace('-head', '');
                let hasVisible = $('#'+masterId+'-canvas .worker-row:visible').length > 0;
                if (hasVisible) {
                    $(this).css('display', 'flex');
                    $('#'+masterId+'-canvas').show();
  } else {
                    $(this).hide();
                    $('#'+masterId+'-canvas').hide();
                }
            });
            // Для каждого chief-head внутри этого location
            $('#'+id+'-canvas .chief-head').each(function() {
                let chiefId = $(this).attr('id').replace('-head', '');
                let hasVisible = $('#'+chiefId+'-canvas .master-head:visible, #'+chiefId+'-canvas .worker-row:visible').length > 0;
                if (hasVisible) {
                    $(this).css('display', 'flex');
                    $('#'+chiefId+'-canvas').show();
                } else {
                    $(this).hide();
                    $('#'+chiefId+'-canvas').hide();
                }
            });
        }
    });


// === Принудительно раскрыть нераспределённых и их мастеров после фильтрации/автообновления ===
function forceShowUnassigned() {
    console.log('[forceShowUnassigned] Запуск функции');
    setTimeout(function() {
        // Проверяем, является ли текущий месяц выбранным
        const now = new Date();
        const isCurrentMonth = curDate.getFullYear() === now.getFullYear() && curDate.getMonth() === now.getMonth();
        
        $('.location-head').each(function() {
            let text = $(this).text().toUpperCase();
            if (text.includes('НЕРАСПРЕД') || text.includes('НЕСОТРУДНИК')) {
                let id = $(this).attr('id').replace('-head', '');
                let hasVisible = $('#'+id+'-canvas .worker-row:visible').length > 0;
                // Показываем только если это текущий месяц или есть видимые сотрудники
                if (isCurrentMonth || hasVisible) {
                    this.style.removeProperty('display');
                    this.style.setProperty('display', 'flex', 'important');
                    $(this).removeClass('collapsed');
                    $('#'+id+'-canvas').show();
                    // Аналогично для master-head
                    $('#'+id+'-canvas .master-head').each(function() {
                        let masterId = $(this).attr('id').replace('-head', '');
                        let hasVisible = $('#'+masterId+'-canvas .worker-row:visible').length > 0;
                        if (isCurrentMonth || hasVisible) {
                            this.style.removeProperty('display');
                            this.style.setProperty('display', 'flex', 'important');
                            $(this).removeClass('collapsed');
                            $('#'+masterId+'-canvas').show();
                        }
                    });
                }
            }
        });
        console.log('[forceShowUnassigned] Завершено');
    }, 250);
}



function changeMaster(worker_id){
    let selectedOption = $(':selected', $('#masters-sl'));
    let new_location_uid = selectedOption.parent().attr('value');
    let new_master_uid = selectedOption.val();
    let new_chief_uid = "";
    let currentWorker = null;

    // Находим chief_uid для нового мастера
    for(let l of LOCATIONS){
        if(l.uid === new_location_uid) {
            for(let m of (l.masters || [])){
                 if(m.uid === new_master_uid){
                     new_chief_uid = m.chief_uid;
                     break;
                 }
            }
        }
        if(new_chief_uid) break;
    }


    for(let w of WORKERS){
        let no = Number(WORKERS.indexOf(w))+1; // Более надежный способ найти index
        let id = no+'_'+w['uid'];
        if(id == worker_id){
            currentWorker = w;
            break;
        }
    }

    if (!currentWorker) {
        console.error('Работник не найден для id:', worker_id);
        return;
    }

    // Проверяем, изменились ли мастер ИЛИ начальник ИЛИ объект
    let masterChanged = currentWorker.master_uid !== new_master_uid;
    let chiefChanged = currentWorker.chief_uid !== new_chief_uid;
    let locationChanged = currentWorker.location_uid !== new_location_uid;

    let isTransfer = masterChanged || chiefChanged || locationChanged;

    console.log('[changeMaster] Проверка переноса:', {
        workerUid: currentWorker.uid,
        oldLocation: currentWorker.location_uid,
        newLocation: new_location_uid,
        oldChief: currentWorker.chief_uid,
        newChief: new_chief_uid,
        oldMaster: currentWorker.master_uid,
        newMaster: new_master_uid,
        isTransfer
    });


    if (isTransfer) {
        // Показываем модальное окно переноса
        $('#move-worker-modal').fadeIn(120);
        $('#move-worker-name').text(currentWorker.fio);
        // Устанавливаем текущую дату в инпут
        $('#move-worker-date').val(new Date().toISOString().slice(0,10));
        // Убеждаемся, что чекбокс разделения часов отмечен по умолчанию
        $('#split-hours-checkbox').prop('checked', true);


        // Сохраняем данные для кнопки "Сохранить" в модалке
        $('#move-worker-modal').data('worker_id', worker_id);
        $('#move-worker-modal').data('method', "НазначитьРаботникуНовогоМастера");
        $('#move-worker-modal').data('args', [
            new_location_uid, // location_uid нового мастера
            new_chief_uid, // chief_uid нового мастера
            new_master_uid, // master_uid
            currentWorker.uid // worker_uid
            // Дата будет добавлена пятым аргументом при сохранении
        ]);


        // Обработчик кнопки "Сохранить" в модалке
        $('#move-worker-save-btn').off('click').on('click', async function() {
            let selectedDateStr = $('#move-worker-date').val();
            let splitHours = $('#split-hours-checkbox').is(':checked');
            let wId = $('#move-worker-modal').data('worker_id');
            let method = $('#move-worker-modal').data('method');
            let baseArgs = $('#move-worker-modal').data('args');

            console.log('[move-worker-modal] Клик Сохранить:', { selectedDateStr, splitHours, wId, method, baseArgs });

            $('#move-worker-modal').fadeOut(120, function() {
                 isMoveWorkerModalOpen = false; // Снимаем флаг после завершения анимации скрытия
            });
            $('#info-dv').hide(); // Скрываем info-dv

            let workerUid = wId.split('_')[1];
            let workerIndex = WORKERS.findIndex(w => w.uid === workerUid);
            console.log('[move-worker-modal] Найден работник:', { workerUid, workerIndex });


            let dateToSend = null;
            if (splitHours && selectedDateStr) {
                 // Формат даты YYYYMMDD
                 let selectedDate = new Date(selectedDateStr);
                 selectedDate.setDate(selectedDate.getDate() + 1); // Добавляем +1 день
                 dateToSend = selectedDate.toISOString().slice(0,10).split('-').join('');
                 console.log('[move-worker-modal] Дата для отправки (с +1 днем):', dateToSend);


                // Применяем "СО" на выбранную дату в локальных данных TABEL ДО отправки sendDataTabel
                 if (workerIndex !== -1) {
                     let selectedDate = new Date(selectedDateStr);
                     let selectedDayIndex = -1;
                      for (let i = 0; i < DAYS.length; i++) {
                         let dayObj = DAYS[i];
                          // Учитываем, что month в Date начинается с 0, а в dayObj с 1
                         if (dayObj.year == selectedDate.getFullYear() &&
                             dayObj.month == selectedDate.getMonth() + 1 &&
                             dayObj.day == selectedDate.getDate()) {
                             selectedDayIndex = i;
                             break;
                         }
                     }
                      console.log('[move-worker-modal] Найден индекс дня:', { selectedDate, selectedDayIndex });

                     if (selectedDayIndex !== -1) {
                         let tabId = (workerIndex + 1) + '_' + WORKERS[workerIndex].uid;
                         console.log('[move-worker-modal] ID табеля:', tabId);

                         if (TABEL[tabId] && TABEL[tabId][selectedDayIndex]) {
                            console.log('[move-worker-modal] Обновление локальных данных TABEL: установка VT="СО"', { old: TABEL[tabId][selectedDayIndex], newVt: 'СО' });
                             TABEL[tabId][selectedDayIndex]['vt'] = 'СО';
                             // Часы НЕ ТРОГАЕМ: TABEL[tabId][selectedDayIndex]['hours'] = 0; // УДАЛИТЬ/ЗАКОММЕНТИРОВАТЬ эту строку
                             // Помечаем ячейку как измененную
                            if (!changedCells[tabId]) changedCells[tabId] = {};
                            changedCells[tabId][selectedDayIndex] = TABEL[tabId][selectedDayIndex];
                             TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
                             // Обновляем отображение ячейки
                             let cellSelector = '#' + (workerIndex + 1) + '-' + (selectedDayIndex + 1) + '-day-dv';
                             console.log('[move-worker-modal] Обновление DOM ячейки:', cellSelector);
                             let currentDayData = TABEL[tabId][selectedDayIndex];
                             let htmlValue = '';
                             let hoursNum = Number(currentDayData['hours']); // Используем существующие часы
                             let dayValue = currentDayData['vt'];

                             if(dayValue && !hoursNum){
                                 // Только буквенный код, без часов
                                 htmlValue = `<span class="cell-code-big">${dayValue}</span>`;
                             } else if(dayValue && hoursNum) {
                                 // Есть и код, и часы
                                 htmlValue = `<span class="cell-code-small">${dayValue}</span><span class="cell-hours-big">${hoursNum}</span>`;
                             } else { // Случай без кода и без часов
                                 htmlValue = '';
                             }
                             htmlValue += `<div id="${workerIndex+1}-${selectedDayIndex+1}-day-comment" class="days-comment" title="${currentDayData['comment']||''}"></div>`;

                              $(cellSelector).html(htmlValue).css({"color": selectedFnt, "font-weight": "normal"});
                            // calcDays(); // Пересчитываем итоги - будет вызвано после getDataTabel
                         }
                     }
                 } else {
                      console.error('[move-worker-modal] workerIndex не найден для workerUid:', workerUid);
                 }
            } else {
                 console.log('[move-worker-modal] Разделение часов не выбрано или дата не указана.');
            }

            console.log('[move-worker-modal] changedCells перед sendDataTabel(false):', JSON.stringify(changedCells, null, 2));


             // Вызываем функцию отправки данных changedCells
            await sendDataTabel(false); // Отправляем только измененные ячейки (включая СО, если было)


            // Теперь вызываем changeData для самой операции смены мастера/начальника, передавая дату
             let finalArgs = [...baseArgs, dateToSend]; // Добавляем дату или null последним аргументом

            console.log(`[move-worker-modal] Вызов changeData для ${method} с датой:`, finalArgs);
            // Используем changeData для самой операции смены мастера/начальника
            changeData(method, ...finalArgs);
        });

        // Обработчик кнопки "Отмена" в модалке
        $('#move-worker-cancel-btn').off('click').on('click', function() {
            $('#move-worker-modal').fadeOut(120, function() {
                 isMoveWorkerModalOpen = false; // Снимаем флаг после завершения анимации
                  unselectCells(); // Вызовем unselectCells, чтобы очистить changedCells, если они были добавлены
            });
             $('#info-dv').hide(); // Скрываем info-dv
        });
        // Обработчик крестика в модалке
        $('#move-worker-modal-close').off('click').on('click', function() {
            $('#move-worker-modal').fadeOut(120, function() {
                isMoveWorkerModalOpen = false; // Снимаем флаг после завершения анимации
                 unselectCells(); // Вызовем unselectCells, чтобы очистить changedCells, если они были добавлены
            });
             $('#info-dv').hide(); // Скрываем info-dv
        });

    } else {
        // Ни мастер, ни начальник, ни объект не изменились - ничего не делаем
                $('#info-dv .info-save-dv').hide();
            }
}

function changeChief(worker_id){
    let selectedOption = $(':selected', $('#chiefs-sl'));
    let new_location_uid = selectedOption.parent().attr('value');
    let new_chief_uid = selectedOption.val();
    let currentWorker = null;

    for(let w of WORKERS){
        let no = Number(WORKERS.indexOf(w))+1; // Более надежный способ найти index
        let id = no+'_'+w['uid'];
        if(id == worker_id){
            currentWorker = w;
            break;
        }
    }

    if (!currentWorker) {
        console.error('Работник не найден для id:', worker_id);
        return;
    }

    // Проверяем, изменился ли начальник ИЛИ объект
    let chiefChanged = currentWorker.chief_uid !== new_chief_uid;
    let locationChanged = currentWorker.location_uid !== new_location_uid;

    let isTransfer = chiefChanged || locationChanged;

    console.log('[changeChief] Проверка переноса:', {
        workerUid: currentWorker.uid,
        oldLocation: currentWorker.location_uid,
        newLocation: new_location_uid,
        oldChief: currentWorker.chief_uid,
        newChief: new_chief_uid,
        isTransfer
    });

    if (isTransfer) {
         // Показываем модальное окно переноса
        $('#move-worker-modal').fadeIn(120);
        $('#move-worker-name').text(currentWorker.fio);
         // Устанавливаем текущую дату в инпут
        $('#move-worker-date').val(new Date().toISOString().slice(0,10));
        // Убеждаемся, что чекбокс разделения часов отмечен по умолчанию
        $('#split-hours-checkbox').prop('checked', true);


        // Сохраняем данные для кнопки "Сохранить" в модалке
        $('#move-worker-modal').data('worker_id', worker_id);
        $('#move-worker-modal').data('method', "НазначитьМастеруНовогоНачальника");
        $('#move-worker-modal').data('args', [
            new_location_uid, // location_uid нового начальника
            currentWorker.location_uid, // location_uid старого начальника (требуется для этой команды)
            new_chief_uid, // chief_uid
            currentWorker.uid // worker_uid
            // Дата будет добавлена пятым аргументом при сохранении
        ]);


        // Обработчик кнопки "Сохранить" в модалке
        $('#move-worker-save-btn').off('click').on('click', async function() {
            let selectedDateStr = $('#move-worker-date').val();
            let splitHours = $('#split-hours-checkbox').is(':checked');
            let wId = $('#move-worker-modal').data('worker_id');
            let method = $('#move-worker-modal').data('method');
            let baseArgs = $('#move-worker-modal').data('args');

            $('#move-worker-modal').fadeOut(120);
            $('#info-dv').hide(); // Скрываем info-dv

            let workerUid = wId.split('_')[1];
            let workerIndex = WORKERS.findIndex(w => w.uid === workerUid);

            let dateToSend = null;
            if (splitHours && selectedDateStr) {
                 // Формат даты YYYYMMDD
                 let selectedDate = new Date(selectedDateStr);
                 selectedDate.setDate(selectedDate.getDate() + 1); // Добавляем +1 день
                 dateToSend = selectedDate.toISOString().slice(0,10).split('-').join('');
                 console.log('[changeChief] Дата для отправки (с +1 днем):', dateToSend);

                // Применяем "СО" на выбранную дату в локальных данных TABEL ДО отправки sendDataTabel
                 if (workerIndex !== -1) {
                     let selectedDate = new Date(selectedDateStr);
                     let selectedDayIndex = -1;
                      for (let i = 0; i < DAYS.length; i++) {
                         let dayObj = DAYS[i];
                         if (dayObj.year == selectedDate.getFullYear() &&
                             dayObj.month == selectedDate.getMonth() + 1 &&
                             dayObj.day == selectedDate.getDate()) {
                             selectedDayIndex = i;
                             break;
                         }
                     }
                     if (selectedDayIndex !== -1) {
                         let tabId = (workerIndex + 1) + '_' + WORKERS[workerIndex].uid;
                         if (TABEL[tabId]) {
                             TABEL[tabId][selectedDayIndex]['vt'] = 'СО';
                             TABEL[tabId][selectedDayIndex]['hours'] = 0;
                             // Помечаем ячейку как измененную
                            if (!changedCells[tabId]) changedCells[tabId] = {};
                            changedCells[tabId][selectedDayIndex] = TABEL[tabId][selectedDayIndex];
                             TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
                             // Обновляем отображение ячейки
                             let cellSelector = '#' + (workerIndex + 1) + '-' + (selectedDayIndex + 1) + '-day-dv';
                             let htmlValue = `<span class="cell-code-big">СО</span>`;
                              htmlValue += `<div id="${workerIndex+1}-${selectedDayIndex+1}-day-comment" class="days-comment" title="${TABEL[tabId][selectedDayIndex]['comment']||''}"></div>`;
                              $(cellSelector).html(htmlValue).css({"color": selectedFnt, "font-weight": "normal"});
                            // calcDays(); // Пересчитываем итоги - будет вызвано после getDataTabel
                         }
                     }
                 }
            }

             // Вызываем функцию отправки данных changedCells
            await sendDataTabel(false); // Отправляем только измененные ячейки (включая СО, если было)


            // Теперь вызываем changeData для самой операции смены мастера/начальника, передавая дату
             let finalArgs = [...baseArgs, dateToSend]; // Добавляем дату или null последним аргументом

            console.log(`[changeChief] Вызов changeData для ${method} с датой:`, finalArgs);
            // Используем changeData для самой операции смены мастера/начальника
            changeData(method, ...finalArgs);
        });

        // Обработчик кнопки "Отмена" в модалке
        $('#move-worker-cancel-btn').off('click').on('click', function() {
            $('#move-worker-modal').fadeOut(120);
             $('#info-dv').hide(); // Скрываем info-dv
        });
        // Обработчик крестика в модалке
        $('#move-worker-modal-close').off('click').on('click', function() {
            $('#move-worker-modal').fadeOut(120);
             $('#info-dv').hide(); // Скрываем info-dv
        });

    } else {
         // Ни начальник, ни объект не изменились - ничего не делаем
         $('#info-dv .info-save-dv').hide();
    }
}

// === Проверка lock для ячеек ===
function isCellLocked(row, col, value) {
    // Список разрешённых кодов
    const allowedFutureCodes = ["Б", "ОТ", "ОД", "У", "Р", "ОЖ", "ОБ", "ПК", "ДО", "УВ"];

    // Проверяем, что это текущий месяц и день в будущем
    let isCurrentMonth = curDate.getFullYear() === new Date().getFullYear() && curDate.getMonth() === new Date().getMonth();
    if (
        isCurrentMonth &&
        Number(col) > TODAY &&
        typeof value === "string" &&
        allowedFutureCodes.includes(value.trim().toUpperCase())
    ) {
        return false; // Разрешаем спецкод в будущем дне
    }

    let worker = WORKERS[row];
    if (!worker || !worker.days || !worker.days[col]) return false;
    return !!worker.days[col].lock;
    
}

// --- Модификация setCells ---
let orig_setCells_lock = setCells;
setCells = function(value, isComment=false, isFullClear=false) {
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        if (isCellLocked(cell.row, cell.col, value)) return; // Блокируем редактирование
    }
    return orig_setCells_lock.apply(this, arguments);
};
// --- Модификация setComment ---
let orig_setComment_lock = setComment;
setComment = function(clear=false) {
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        if (isCellLocked(cell.row, cell.col, value)) return;
    }
    return orig_setComment_lock.apply(this, arguments);
};
// --- Модификация startSelect ---
let orig_startSelect_lock = startSelect;
startSelect = function(indexRow, indexCol, event) {
    if (isCellLocked(indexRow, indexCol)) return;
    return orig_startSelect_lock.apply(this, arguments);
};
// --- Модификация selectCell ---
let orig_selectCell_lock = selectCell;
selectCell = function(indexRow, indexCol, event) {
    if (isCellLocked(indexRow, indexCol)) return;
    return orig_selectCell_lock.apply(this, arguments);
};
// --- Модификация cellAction ---
let orig_cellAction_lock = cellAction;
cellAction = function(vt) {
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        if (isCellLocked(cell.row, cell.col, vt)) return; // vt — это и есть значение кода!
    }
    return orig_cellAction_lock.apply(this, arguments);
};
// --- Модификация contextAction ---
let orig_contextAction_lock = contextAction;
contextAction = function(act) {
    if(selectedCells.length > 0) {
        let cell = selectedCells[0];
        if (isCellLocked(cell.row, cell.col)) return;
    }
    return orig_contextAction_lock.apply(this, arguments);
};
// --- Визуализация заблокированных ячеек ---

// Вызов после createTabel и после получения данных
let orig_createTabel_lock = createTabel;
createTabel = function() {
    let res = orig_createTabel_lock.apply(this, arguments);
    return res;
};


// 1. Снимаем выделение при изменении поиска по ФИО
$(document).on('input', '#fio-filter-in', function() {
    unselectCells();
});
// 2. Снимаем выделение при клике на фильтр (changeFilter)
let orig_changeFilter_unselect = changeFilter;
changeFilter = function(type) {
    unselectCells();
    return orig_changeFilter_unselect.apply(this, arguments);
};
// 3. При клике на ячейку убираем фокус с поиска по ФИО
let orig_selectCell_unfocus = selectCell;
selectCell = function(indexRow, indexCol, event) {
    if (document.activeElement && document.activeElement.id === 'fio-filter-in') {
        document.activeElement.blur();
    }
    return orig_selectCell_unfocus.apply(this, arguments);
};
let orig_startSelect_unfocus = startSelect;
startSelect = function(indexRow, indexCol, event) {
    if (document.activeElement && document.activeElement.id === 'fio-filter-in') {
        document.activeElement.blur();
    }
    return orig_startSelect_unfocus.apply(this, arguments);
};


// --- Сохранение и восстановление открытых canvases в cookie ---
function saveOpenedCanvasesToCookie() {
    let opened = CANVASES.filter(c => {
        let $canvas = $('#' + c.id + '-canvas');
        return $canvas.is(':visible');
    }).map(c => c.id);
    document.cookie = 'opened_canvases=' + encodeURIComponent(JSON.stringify(opened)) + ';path=/;max-age=2592000';
}
function getOpenedCanvasesFromCookie() {
    let matches = document.cookie.match(/(?:^|; )opened_canvases=([^;]*)/);
    if (matches) {
        try {
            return JSON.parse(decodeURIComponent(matches[1]));
        } catch(e) { return []; }
    }
    return [];
}
// --- Модифицируем slideDiv ---
let orig_slideDiv_saveCanvas = slideDiv;
slideDiv = function(type, uid) {
    let res = orig_slideDiv_saveCanvas.apply(this, arguments);
    setTimeout(saveOpenedCanvasesToCookie, 150);
    return res;
};
// --- Модифицируем rollAll ---
let orig_rollAll_saveCanvas = rollAll;
rollAll = function(way) {
    let res = orig_rollAll_saveCanvas.apply(this, arguments);
    setTimeout(saveOpenedCanvasesToCookie, 150);
    return res;
};
// --- Восстанавливаем открытые canvases при создании таблицы ---
let orig_createTabel_restoreCanvas = createTabel;
createTabel = function() {
    let res = orig_createTabel_restoreCanvas.apply(this, arguments);
    let opened = getOpenedCanvasesFromCookie();
    if (Array.isArray(opened) && opened.length > 0) {
        for (let c of CANVASES) {
            let $canvas = $('#' + c.id + '-canvas');
            let $head = $('#' + c.id + '-head');
            if (opened.includes(c.id)) {
                $canvas.show();
                $head.find('.toggle-bt').css('background-image', 'url("/images/report/up.png")');
                $head.removeClass('collapsed');
            } else {
                $canvas.hide();
                $head.find('.toggle-bt').css('background-image', 'url("/images/report/down.png")');
                $head.addClass('collapsed');
            }
        }
    }
    return res;
};


// --- Жёсткое скрытие fixstate-menu при любом клике вне него и при скролле (нативный обработчик) ---
document.addEventListener('mousedown', function(e) {
    const fixMenu = document.getElementById('fixstate-menu');
    if (fixMenu && getComputedStyle(fixMenu).display !== 'none' && !e.target.closest('#fixstate-menu')) {
        fixMenu.style.display = 'none';
        console.log('[native] Скрыто fixstate-menu по клику вне меню');
    }
}, true);
window.addEventListener('scroll', function() {
    const fixMenu = document.getElementById('fixstate-menu');
    if (fixMenu && getComputedStyle(fixMenu).display !== 'none') {
        fixMenu.style.display = 'none';
        console.log('[native] Скрыто fixstate-menu по скроллу');
    }
}, true);

// --- Принудительно показываем всех начальников (chief-head) в нераспределённых ---
function showAllChiefsInUnassigned() {
    // Проверяем, является ли текущий месяц выбранным
    const now = new Date();
    const isCurrentMonth = curDate.getFullYear() === now.getFullYear() && curDate.getMonth() === now.getMonth();
    
    $('.location-head').each(function() {
        let text = $(this).text().toUpperCase();
        if (text.includes('НЕРАСПРЕД') || text.includes('НЕСОТРУДНИК')) {
            let id = $(this).attr('id').replace('-head', '');
            // Показываем только если это текущий месяц
            if (isCurrentMonth) {
                // Для каждого chief-head внутри этого location
                $('#'+id+'-canvas .chief-head').each(function() {
                    $(this).css('display', 'flex');
                    let chiefId = $(this).attr('id').replace('-head', '');
                    $('#'+chiefId+'-canvas').show();
                });
            }
        }
    });
}
// После applyOrgFilter и forceShowUnassigned вызываем showAllChiefsInUnassigned
let oldApplyOrgFilter = window.applyOrgFilter;
window.applyOrgFilter = function() {
    oldApplyOrgFilter();
    setTimeout(function() {
        if (typeof forceShowUnassigned === 'function') forceShowUnassigned();
        showAllChiefsInUnassigned();
    }, 300);
};


// Скрытие окна детального просмотра при клике вне его
$(document).on('mousedown.hideInfoDv', function(e) {
    if ($('#info-dv').is(':visible') && !$(e.target).closest('#info-dv').length && !$(e.target).hasClass('info-row')) {
        $('#info-dv').hide();
    }
});



// Функция для навешивания обработчиков скрытия info-dv
function attachInfoDvHideHandler() {
    $(document).off('mousedown.hideInfoDv').on('mousedown.hideInfoDv', function(e) {
        if ($('#info-dv').is(':visible') && !$(e.target).closest('#info-dv').length && !$(e.target).hasClass('info-row')) {
            $('#info-dv').hide();
        }
    });
    $(window).off('scroll.hideInfoDv').on('scroll.hideInfoDv', function() {
        if ($('#info-dv').is(':visible')) {
            $('#info-dv').hide();
        }
    });
}
// Навешиваем обработчик при загрузке
$(document).ready(function() {
    attachInfoDvHideHandler();
});
// После любого глобального .off('mousedown') или .off() — снова навешиваем
// В режиме только для чтения
$(document).ready(function() {
  if (IS_READONLY) {
    $(document).off('mousedown');
    attachInfoDvHideHandler();
  }
});
// После крупных обновлений
if (typeof getDataTabel === 'function') {
    let orig_getDataTabel_attachInfo = getDataTabel;
    getDataTabel = function() {
        let res = orig_getDataTabel_attachInfo.apply(this, arguments);
        attachInfoDvHideHandler();
        return res;
    };
}
if (typeof createTabel === 'function') {
    let orig_createTabel_attachInfo = createTabel;
    createTabel = function() {
        let res = orig_createTabel_attachInfo.apply(this, arguments);
        attachInfoDvHideHandler();
        return res;
    };
}



// Обработчики скрытия info-dv — только один раз при загрузке
$(document).ready(function() {
    $(document).on('mousedown.hideInfoDv', function(e) {
        if ($('#info-dv').is(':visible') && !$(e.target).closest('#info-dv').length && !$(e.target).hasClass('info-row')) {
            $('#info-dv').hide();
        }
    });
    $(window).on('scroll.hideInfoDv', function() {
        if ($('#info-dv').is(':visible')) {
            $('#info-dv').hide();
        }
    });
});

// Тултип по всем сотрудникам при наведении на #master-head
let masterHeadTooltipTimeout = null;

function positionMasterTooltip() {
    let $this = $('#master-head');
    let $tooltip = $('#master-tooltip');
    if (!$this.length || !$tooltip.length || !$tooltip.is(':visible')) return;
    let offset = $this.offset();
    let tooltipW = $tooltip.outerWidth();
    let tooltipH = $tooltip.outerHeight();
    let left = offset.left + $this.outerWidth() + 10;
    let top = offset.top;
    let winW = $(window).width();
    let winH = $(window).height();
    let scrollTop = $(window).scrollTop();

    // Если не помещается справа — показываем слева
    if (left + tooltipW > winW - 10) {
        left = offset.left - tooltipW - 10;
        if (left < 10) left = 10;
    }

    // --- КОРРЕКТНОЕ ПОВЕДЕНИЕ ПО ВЕРТИКАЛИ ---
    // Если тултип не помещается снизу — показываем строго над #master-head
    if (top + tooltipH > winH + scrollTop - 10) {
        top = offset.top - tooltipH;
        if (top < scrollTop + 10) top = scrollTop + 10; // не выше окна
    }

    $tooltip.css({top: top + 'px', left: left + 'px'});
}

$(document).on('mouseenter', '#master-head', function(e) {
    if (masterHeadTooltipTimeout) clearTimeout(masterHeadTooltipTimeout);
    const $this = $(this);
    masterHeadTooltipTimeout = setTimeout(function() {
        let workersForTooltip = Array.isArray(WORKERS) ? WORKERS.slice() : [];
        // Фильтрация "несотрудников"
        workersForTooltip = workersForTooltip.filter(
            w => w && w.uid && w.fio && typeof w.fio === 'string' && !/^[<‹]/.test(w.fio.trim())
        );
        
        let todayIndex = getStatsDayIndex();
        
        // Формируем тултип аналогично tooltipStats
        let countY = 0, countB = 0, countEmpty = 0;
        let detailedNotPresentCounts = {'НН': 0, 'НВ': 0, 'Г': 0, 'МО': 0};
        let detailedAbsentCounts = {'ОТ': 0, 'ОД': 0, 'У': 0, 'ОБ': 0, 'ПК': 0, 'Д': 0, 'СО': 0, 'УВ': 0, 'Р': 0, 'ОЖ': 0, 'ДО': 0, 'В': 0, 'К': 0, 'ПЧ':0};
        let totalWorkers = 0;
        for(let w_idx in workersForTooltip){
            let worker = workersForTooltip[w_idx];
            let vt = '';
            if (!worker.days || !Array.isArray(worker.days) || worker.days.length <= todayIndex || !worker.days[todayIndex] || typeof worker.days[todayIndex] !== 'object') {
                countEmpty++;
                totalWorkers++;
                continue;
            }
            vt = ('vt' in worker.days[todayIndex]) ? String(worker.days[todayIndex].vt) : '[NO VT FIELD]';
            let hours = ('hours' in worker.days[todayIndex]) ? Number(worker.days[todayIndex].hours) : 0;
            totalWorkers++;
            if (
                (!('vt' in worker.days[todayIndex]) || String(worker.days[todayIndex].vt).trim() === '') && hours === 0
            ) {
                countEmpty++;
                continue;
            }
            if (vt === '' && hours === 0) {
                countEmpty++;
                continue;
            }
            vt = String(worker.days[todayIndex].vt).toUpperCase();
            if (vt === 'Я') {
                countY++;
            } else if (vt === 'Б') {
                countB++;
            } else if (detailedNotPresentCounts.hasOwnProperty(vt)) {
                detailedNotPresentCounts[vt]++;
            } else if (detailedAbsentCounts.hasOwnProperty(vt)) {
                detailedAbsentCounts[vt]++;
            } else if (vt === '') {
                countEmpty++;
            }
        }
        let sumNotPresent = countB + detailedNotPresentCounts['НВ'] + detailedNotPresentCounts['Г'] + detailedNotPresentCounts['МО'];
        let sumAbsent = 0;
        for (const code in detailedAbsentCounts) {
            sumAbsent += detailedAbsentCounts[code];
        }
        let statsTableHtml = `
        <div class=\"master-tooltip-content\">
            <table style=\"width:100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;\">
                <tr>
                     <td style=\"padding: 2px;font-weight: bold; font-size: 13px;\">На объекте</td>
                     <td style=\"padding: 2px; text-align:right; font-weight: bold; font-size: 13px;\">${totalWorkers - sumAbsent}</td>
                </tr>
            </table>
            <table style=\"width:100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;\">
                <tr>
                     <td style=\"padding: 2px;font-weight: bold; font-size: 13px;\">Явка</td>
                     <td style=\"padding: 2px; text-align:right; font-weight: bold; font-size: 13px;\">${countY}</td>
                </tr>
            </table>
            <div style=\"display: flex; justify-content: space-between; margin-top: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;\">
                <div style=\"width: 48%;\">
                    <table style=\"width:100%; border-collapse: collapse;\">
                        <tr><td style=\"padding: 1px 2px; font-weight: bold; font-size: 13px;\">Не выход</td><td style=\"padding: 1px 2px; text-align:right; font-weight: bold;font-size: 13px\"> ${sumNotPresent}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">Б</td><td style=\"padding: 1px 2px; text-align:right;\">${countB}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">НВ</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedNotPresentCounts['НВ']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">Г</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedNotPresentCounts['Г']}</td></tr>
                        <tr><td style=\"padding: 1px 2px;\">МО</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedNotPresentCounts['МО']}</td></tr>
                    </table>
                </div>
                <div style=\"width: 48%;\">
                    <table style=\"width:100%; border-collapse: collapse;\">
                        <tr><td style=\"padding: 1px 2px; font-weight: bold; font-size: 13px;\">Отсутствуют</td><td style=\"padding: 1px 2px; text-align:right; font-weight: bold;font-size: 13px\">${sumAbsent}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">ОТ</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ОТ']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">ОД</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ОД']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">У</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['У']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">ОБ</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ОБ']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">ПК</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ПК']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">Д</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['Д']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">СО</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['СО']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">УВ</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['УВ']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">Р</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['Р']}</td></tr>
                        <tr><td style=\"padding: 1px 2px;\">ОЖ</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ОЖ']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;">ДО</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ДО']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">В</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['В']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">К</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['К']}</td></tr>
                        <tr style=\"border-bottom: 1px dotted #eee;\"><td style=\"padding: 1px 2px;\">ПЧ</td><td style=\"padding: 1px 2px; text-align:right;\">${detailedAbsentCounts['ПЧ']}</td></tr>
                    </table>
                </div>
            </div>
            <table style=\"width: 100%; margin-top: 5px; border-collapse: collapse;\">
                 <tr>
                    <td style=\"padding: 1px 2px; width: 20%; font-weight: bold; font-size: 13px;\">НН</td>
                    <td style=\"padding: 1px 2px; text-align:right; width: 28%; font-weight: bold; font-size: 13px;\">${detailedNotPresentCounts['НН']}</td>
                    <td style=\"padding: 1px 2px; width: 20%; padding-left: 10px; font-weight: bold; font-size: 13px;\">Пусто</td>
                    <td style=\"padding: 1px 2px; text-align:right; width: 28%; font-weight: bold; font-size: 13px;\">${countEmpty}</td>
                </tr>
            </table>
        </div>
        `;
        let $tooltip = $('#master-tooltip');
        if ($tooltip.length === 0) {
            $('body').append('<div id="master-tooltip" class="tooltip-popup" style="position: absolute; z-index: 9999; background: white; border: 1px solid #788cad; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border-radius: 5px; padding: 10px; display: none; max-width: 400px;"></div>');
            $tooltip = $('#master-tooltip');
        }
        $tooltip.html(statsTableHtml);
        $tooltip.show();
        positionMasterTooltip();
        // Навешиваем обработчики scroll/resize для прилипания
        $(window).on('scroll.masterTooltip resize.masterTooltip', positionMasterTooltip);
    }, 0); // 0 секунд задержка
});
$(document).on('mouseleave', '#master-head', function() {
    if (masterHeadTooltipTimeout) clearTimeout(masterHeadTooltipTimeout);
    $('#master-tooltip').hide();
    // Снимаем обработчики scroll/resize
    $(window).off('scroll.masterTooltip resize.masterTooltip');
});








// --- ДОБАВЛЕНО: Новая функция для показа табеля по объектам ---
// ... existing code ...
async function showWorkerObjectsTabel(workerId, event) {

    let dateForRequest;
if (typeof curDate !== 'undefined' && curDate instanceof Date) {
    const now = new Date();
    if (curDate.getFullYear() === now.getFullYear() && curDate.getMonth() === now.getMonth()) {
        dateForRequest = now.format("yyyymmdd"); // Текущий месяц — сегодня
    } else {
        dateForRequest = curDate.format("yyyymmdd"); // Прошлый месяц — последний день месяца
    }
} else {
    dateForRequest = (new Date()).format("yyyymmdd");
}
    // === ДОБАВЛЕНО: Снимаем любое текущее выделение строки только для чтения ===
    clearReadOnlyRowSelection();

    // Предотвращаем всплытие события, чтобы не сработал selectRow на родительском div
    event.stopPropagation();
    console.log('[showWorkerObjectsTabel] Функция вызвана для сотрудника (UID):', workerId); // Отладочное сообщение
    console.log('[showWorkerObjectsTabel] Объект события:', event); // Отладочное сообщение

    // === ДОБАВЛЕНО: Сразу показываем модальное окно с локальным лоадером ===
    // Получаем ФИО заранее
    const workerFio = $(event.target).next('span').text();
    let modalHtml = '<div id="worker-objects-modal" class="worker-objects-modal">';
    modalHtml += '<div class="modal-header">Сумма часов по объектам для ' + workerFio + '<button class="modal-close" onclick="closeWorkerObjectsModal()"><i class="fas fa-times"></i></button></div>';
    modalHtml += '<div class="modal-content">';
    modalHtml += '<div class="object-table-container" style="text-align:center;padding:30px 0;">';
    modalHtml += '<span class="object-loader">Загрузка...</span>';
    modalHtml += '</div></div></div>';
    // Удаляем предыдущее модальное окно, если оно есть
    $('#worker-objects-modal').remove();
    $('body').append(modalHtml);

    // === ИЗМЕНЕНО: Находим родительский элемент .worker-row, используя event.target ===
    const $plusButton = $(event.target); // Элемент, на который кликнули (кнопка "+")
    // === Получаем реальный номер строки (rowNum) из DOM ===
    let rowNum = null;
    let $workerRow = $plusButton.closest('.worker-row, .row-days-dv');
    if ($workerRow.length > 0) {
        let id = $workerRow.attr('id');
        let match = id && id.match(/^([0-9]+)_/);
        if (match) {
            rowNum = parseInt(match[1], 10);
        }
    }
    const workerRowOffset = $workerRow.offset();
    const workerRowHeight = $workerRow.outerHeight();
    $('#worker-objects-modal').css({
        top: workerRowOffset.top + workerRowHeight + 'px',
        left: workerRowOffset.left + 'px',
        width: $workerRow.outerWidth() + 'px'
    }).show();

    // === ДОБАВЛЕНО: Выделяем строку сотрудника для чтения ===
    const rowIndex = WORKERS.findIndex(worker => worker.uid === workerId);
    console.log('[showWorkerObjectsTabel] rowIndex:', rowIndex, 'workerId:', workerId, 'rowNum:', rowNum, 'WORKERS:', WORKERS.map(w=>w.uid));
    if (rowIndex !== -1 && rowNum !== null) {
        const worker = WORKERS[rowIndex];
        let rowId = rowNum + '_' + worker.uid + '-row';
        let dvId = rowNum + '_' + worker.uid + '-dv';
        let numId = rowNum + 'number-row';
        $('#'+rowId).addClass('readonly-row-selected');
        $('#'+dvId).addClass('readonly-row-selected');
        $('#'+numId).addClass('readonly-row-selected');
        for (let j in DAYS) {
            let col_no = Number(j) + 1;
            let cellId = rowNum + '-' + col_no + '-day-dv';
            let $cell = $('#' + cellId);
            $cell.data('oldBg', $cell[0] ? $cell[0].style.background : undefined);
            if ($cell[0]) $cell[0].style.background = '#6690EF';
            $cell.addClass('readonly-row-selected');
            let dayType = DAYS[j]['weekend'] ? 'weekend' : 'work';
            $cell.removeClass('days-work days-weekend');
            $cell.addClass('days-' + dayType);
            $cell.css({"color": unselectedFnt});
        }
        $('#'+numId).css("background", selectedBgd);
        isReadOnlyRowSelected = true;
        readOnlyRowIndex = rowIndex;
        readOnlyRowNum = rowNum;
    }

    // === ДОБАВЛЕНО: После показа модального окна делаем асинхронный запрос и заменяем содержимое ===
    const today = new Date();
    const todayFormatted = dateForRequest;
    try {
        const data = await getData(false, true, 'ПолучитьКоличествоЧасовПоУчасткам', [workerId, dateForRequest]);
        // === ДОБАВЛЕНО: Формируем HTML с таблицей и суммой часов ===
        let contentHtml = '';
        contentHtml += '<div class="object-table-container">';
        contentHtml += '<div class="object-name object-table-header">Объект</div>';
        contentHtml += '<div class="object-hours-header object-table-header">Часы</div>';
        if (data && data.valid && data.result && data.result.length > 0) {
            let totalHours = 0;
            data.result.forEach(obj => {
                contentHtml += '<div class="object-name">' + obj.location_name + '</div>';
                contentHtml += '<div class="object-hours-cell">';
                if (obj.hours !== undefined && obj.hours !== null && obj.hours !== '') {
                    const hours = parseFloat(obj.hours);
                    if (!isNaN(hours)) {
                        contentHtml += hours;
                        totalHours += hours;
                    } else {
                        contentHtml += '0';
                    }
                } else {
                    contentHtml += '0';
                }
                contentHtml += '</div>';
            });
            contentHtml += '<div class="object-table-footer" style="grid-column: span 2; text-align: right; font-weight: bold; margin-top: 10px; padding-top: 5px; border-top: 1px solid #ccc;">Всего часов: ' + parseFloat(totalHours.toFixed(2)) + '</div>';
        } else {
            contentHtml += '<div style="grid-column: span 2;"><p>Данные по объектам не найдены или произошла ошибка.</p>';
            if(data && data.error) {
                contentHtml += '<p>Ошибка: ' + data.error + '</p>';
            }
        }
        contentHtml += '</div>';
        // === Заменяем содержимое модального окна на таблицу ===
        $('#worker-objects-modal .modal-content').html(contentHtml);
    } catch (e) {
        $('#worker-objects-modal .modal-content').html('<div style="padding: 30px 0; text-align: center; color: #b00;">Ошибка при получении данных по объектам.</div>');
        console.error('Ошибка при получении данных по объектам:', e);
    }

    // === ИЗМЕНЕНО: Добавляем обработчик mousedown к модальному окну для закрытия по клику вне его ===
    $('#worker-objects-modal').on('mousedown', function(e) {
         if (!$(e.target).closest('.worker-objects-modal .modal-content').length && !$(e.target).closest('.worker-objects-modal .modal-header').length) {
             closeWorkerObjectsModal();
         }
     });
    $(window).on('scroll.objectsModal', function() {
        if ($('#worker-objects-modal').is(':visible')) {
            closeWorkerObjectsModal();
        }
    });
}

// --- ДОБАВЛЕНО: Функция для закрытия модального окна ---
function closeWorkerObjectsModal() {
    let $modal = $('#worker-objects-modal');
    // === ИЗМЕНЕНО: Проверяем, существует ли модальное окно перед попыткой его закрыть/удалить ===
    if ($modal.length > 0) {
        console.log('[closeWorkerObjectsModal] Закрытие и удаление модального окна объектов.'); // Лог для отладки
        // === ИЗМЕНЕНО: Немедленно удаляем модальное окно ===
        $modal.remove();

        // === ИЗМЕНЕНО: Немедленно удаляем обработчики событий ===
        $(document).off('mousedown.objectsModal'); // Удаляем обработчик клика с document
        $(window).off('scroll.objectsModal'); // Удаляем обработчик скролла с окна
         // Удаляем обработчик mousedown, который мог быть добавлен на само модальное окно в предыдущих попытках
        $modal.off('mousedown');
    } else {
        console.log('[closeWorkerObjectsModal] Модальное окно объектов не найдено.'); // Лог для отладки
    }

    // Обработчик click на оверлее (если он был добавлен) удалится автоматически при удалении оверлея.
    // Если используется оверлей, то удалять нужно его, а не только модальное окно.
    // В текущей реализации без оверлея удаляем только модальное окно.

    // === ДОБАВЛЕНО: Снимаем выделение строки только для чтения при закрытии модального окна ===
    clearReadOnlyRowSelection();

}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setFullReadonlyCookie,
        getFullReadonlyCookie,
        setReadAllCookie,
        getReadAllCookie,
        getTodayYMD,
        parseDateIn,
        checkSession,
        checkActivity,
        getDataTabel
    };
}










