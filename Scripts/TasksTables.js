const TasksTableTypes = {
    Daily:     {value: 1, label: 'Daily'},
    Weekly:    {value: 2, label: 'Weekly'},
    Monthly:   {value: 3, label: 'Monthly'},
    Recurring: {value: 4, label: 'Recurring'},
    OneTime:   {value: 5, label: 'One Time'}
};

let TasksAccordionSettingsHTML = `<br>`;
$(function() {
    for (let key in TasksTableTypes) {
        let value = TasksTableTypes[key].value;
        let label = TasksTableTypes[key].label;

        TasksAccordionSettingsHTML += `
            <div class="form-check form-check-inline form-switch">
                <input type="checkbox" id="AccLoadOpen${value}" class="form-check-input">
                <label for="AccLoadOpen${value}" class="form-label">${label}</label>
            </div>
        `
    };

    $('#TasksAccordionSettings').append(TasksAccordionSettingsHTML);
});

let TasksTablesHTML = ``;
$(function() {
    NewTasksPlanRowID = 0;

    let JSONImport;
    try {
        JSONImport = JSON.parse(localStorage.getItem("TaskTrackerSessionState"));
    } catch {};

    for (let key in TasksTableTypes) {
        let value = TasksTableTypes[key].value;
        let label = TasksTableTypes[key].label;

        let Open = false;
        if (JSONImport == null) {
            Open = true;
        }
        else if (Object.hasOwn(JSONImport, `AccLoadOpen${value}`)) {
            Open = JSONImport[`AccLoadOpen${value}`];
        };

        // console.log(Open, `AccLoadOpen${value}`);

        TasksTablesHTML += `
            <div class="accordion">
                <div class="accordion-item">
                    <h2 class="accordion-header" id="TasksAccordion${value}">
                        <button class="accordion-button ${Open ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#TasksTableAccordionContent${value}" aria-expanded="${Open}" aria-controls="TasksTableAccordionContent${value}">
                            <h4 class="d-block w-100 text-center">${label} Tasks</h4>
                        </button>
                    </h2>
                    <div id="TasksTableAccordionContent${value}" class="accordion-collapse ${Open ? 'show' : 'collapse'}" aria-labelledby="TasksTableAccordion${value}" data-bs-parent="#TasksTableAccordion${value}">
                        <div class="accordion-body" style="overflow-x: auto; padding: 5px;">
                            <table id="TasksTable${value}" class="TasksTable table table-bordered table-striped" style="font-size: min(3vw, 16px); text-align: center; border: 1px;">
                                <thead>
                                    <tr>
                                        <th style="width: 10%;">
                                            <!-- Vertical Grip -->
                                        </th>
                                        <th style="width: 20%; min-width: 80px;">
                                            Task
                                        </th>
                                        <th style="width: 30%; min-width: 80px;">
                                            Next Deadline <a data-toggle="tooltip" title="This will update automatically for daily, weekly, and monthly tables."><i class="bi bi-question-circle" style="color: black;"></i></a>
                                        </th>
                                        <th style="width: 20%; min-width: 80px;">
                                            Notes
                                        </td>
                                        <th style="width: 10%; min-width: 80px;">
                                            Completed
                                        </th>

                                        <th style="width: 10%;">
                                            <!-- Remove Button -->
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="TasksTableBody${value}">
                                    <tr id="TasksLoadingMessage${value}" class="TasksTableLoadingMessage"><td colspan="6">Loading...</td></tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="7">
                                            <button id="AddRowButton" type="button" style="width: 100%" class="btn btn-add" onclick="AddTasksPlanRow(${value});">
                                                <b><i class="bi bi-plus-lg" style="font-size: 30px; font-weight: bold; color: white;"></i></b>
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <br>
        `
    };

    $('#TasksTablesDiv').html(TasksTablesHTML);

    for (let key in TasksTableTypes) {
        $(`#TasksTableBody${TasksTableTypes[key].value}`).sortable({
            handle: ".handle",
            update: function() {
                ValidateTasksPlanningTable();
                UnsavedChanges = true;
            }
        });
    };
});

function AddTasksPlanRow(TableID) {
    let value; let label;
    for (let key in TasksTableTypes) {
        if (TasksTableTypes[key].value == TableID) {
            value = TasksTableTypes[key].value;
            label = TasksTableTypes[key].label;
            break;
        };
    };

    let NewRow = $(
        `<tr data-tasks-plan-rowid="${NewTasksPlanRowID}" data-tasks-plan-type="${value}">
            <td class="handle" style="vertical-align: middle;"><i class="bi bi-arrows-move" style="font-size: 20px"></i></td>
            <td>
                <input type="text" class="TasksPlanItem form-control" style="width: 100%;">
            </td>
            <td>
                <div class="row">
                    <div class="col-lg-6">
                        <input class="TasksPlanDueDate form-control" type="text" data-parsley-required="true" data-parsley-mmddyyyy>
                    </div>
                    <div class="col-lg-6">
                        <input class="TasksPlanDueTime form-control" type="time" data-parsley-required="true">
                    </div>
                </div>
                <span class='TasksPlanCountdown'></span>
            </td>
            <td>
                <textarea class="TasksPlanNotes TasksPlanField TableField form-control" rows="1" style="width: 100%;"></textarea>
            </td>
            <td class="td-label">
                <label class="td-label">
                    <input type="checkbox" class="TasksPlanCompleted form-check-input" onchange="ToggleTasksPlanRow(this, ${NewTasksPlanRowID}); ValidateTasksPlanningTable();">
                </label>
            </td>
            <td>
                <button type="button" class="btn btn-danger" onclick="$('tr[data-tasks-plan-rowid=${NewTasksPlanRowID}]').remove(); ValidateTasksPlanningTable(); CheckForUnsavedChanges();">
                    <i class="bi bi-x-lg" style="font-weight: bold;"></i>
                </button>
            </td>
        </tr>`
    );

    $(`#TasksTableBody${value}`).append(NewRow);
    $(`#TasksTableBody${value}`).sortable("refresh");

    $(`tr[data-tasks-plan-rowid=${NewTasksPlanRowID}] .TasksPlanGoalsCell`).sortable();
    $(`tr[data-tasks-plan-rowid=${NewTasksPlanRowID}] input, tr[data-tasks-plan-rowid=${NewTasksPlanRowID}] select`).addClass('TasksPlanField TableField');

    $(`tr[data-tasks-plan-rowid=${NewTasksPlanRowID}]`).find(".TasksPlanDueDate").mask("00/00/0000", {placeholder: 'mm/dd/yyyy' }).datepicker({
        changeMonth: true,
        changeYear: true,
    }).on('change', function() {
        $(this).trigger('input');
        $(this).parsley().validate(); // For some reason parsley text won't show up without this.
    });

    SetDueDateCountDown(NewTasksPlanRowID);
    SetParsleyValidations(Validate=false);
    UpdateUnsavedChangesListener();
    NewTasksPlanRowID++;
};

function SetDueDateCountDown(RowID) {
    let Row = $(`tr[data-tasks-plan-rowid="${RowID}"]`);

    let TimerInterval = setInterval(function() {
        let DueDate = Row.find('.TasksPlanDueDate').val();
        let DueTime = Row.find('.TasksPlanDueTime').val();
       
        let CountDownDateTime = moment(`${DueDate} ${DueTime}`);

        // console.log(CountDownDateTime)

        if (!CountDownDateTime.isValid()) {
            Row.find('.TasksPlanCountdown').html('');
        }
        else {
            let Now = new Date().getTime();
            let TimeDiff = (CountDownDateTime - Now)/1000;            
            AbsTimeDiff = Math.abs(TimeDiff)
            
            let days = Math.floor(AbsTimeDiff / (60 * 60 * 24));
            let hours = Math.floor((AbsTimeDiff % (60 * 60 * 24)) / (60 * 60));
            let minutes = Math.floor((AbsTimeDiff % (60 * 60)) / (60));
            let seconds = Math.floor(AbsTimeDiff % 60);

            if (TimeDiff >= 0) {
                Row.find('.TasksPlanCountdown').html(`(Due in: ${days}d ${hours}h ${minutes}m ${seconds}s)`);
            } // TODO: Make this more programatic.
            else if (Row.attr('data-tasks-plan-type') == TasksTableTypes.Daily.value) {
                Row.find('.TasksPlanCompleted').prop('checked', false).change();
                Row.find('.TasksPlanCountdown').html('');

                while(moment(`${DueDate} ${DueTime}`) <= Now) {
                    DueDate = moment(DueDate).add(1, 'days').format('MM/DD/YYYY')
                };
                Row.find('.TasksPlanDueDate').val(DueDate);
            }
            else if (Row.attr('data-tasks-plan-type') == TasksTableTypes.Weekly.value) {
                Row.find('.TasksPlanCompleted').prop('checked', false).change();
                Row.find('.TasksPlanCountdown').html('');
                while(moment(`${DueDate} ${DueTime}`) <= Now) {
                    DueDate = moment(DueDate).add(7, 'days').format('MM/DD/YYYY')
                };
                Row.find('.TasksPlanDueDate').val(DueDate);
            }
            else if (Row.attr('data-tasks-plan-type') == TasksTableTypes.Monthly.value) {
                Row.find('.TasksPlanCompleted').prop('checked', false).change();
                Row.find('.TasksPlanCountdown').html('');
               
                while(moment(`${DueDate} ${DueTime}`) <= Now) {
                    DueDate = moment(DueDate).add(1, 'months').format('MM/DD/YYYY')
                };
                Row.find('.TasksPlanDueDate').val(DueDate);
            }
            else {
                Row.find('.TasksPlanCountdown').html(`(Over due by: ${days}d ${hours}h ${minutes}m ${seconds}s)`);
            };
        };
    }, 1000);
};

function SortTasksPlanningTable() {
    let TableRowSortingArray = [];

    $('tr[data-tasks-plan-rowid]').each(function() {
        let BannerID = $(this).find('.TasksPlanBanner').attr('data-banner-id');

        if (BannerID == 0) { // We don't need additional info for empty rows and trying to get it from BannersInfo will cause a crash.
            TableRowSortingArray.push({RowID: $(this).attr('data-tasks-plan-rowid')});
        }
        else {
            TableRowSortingArray.push({
              RowID: $(this).attr('data-tasks-plan-rowid'),
              Priority: $(this).find('.TasksPlanPriorityBanner').is(':checked'),
              BannerType: BannersInfo[BannerID].Type,
              StartDate: BannersInfo[BannerID].StartDate
            });
        };
    });

    TableRowSortingArray.sort((a, b) => {
        if (a.StartDate == undefined) {
            return -1;
        }
        else if (b.StartDate == undefined) {
            return +1;
        };

        if (a.StartDate < b.StartDate) {
            return -1;
        }
        else if (a.StartDate <= b.StartDate) {
            if (a.Priority && !b.Priority) {
                return -1;
            }
            else if (!a.Priority && b.Priority) {
                return +1;
            }
            else if (a.BannerType < b.BannerType) {
                return -1;
            }
            else if (a.BannerType > b.BannerType) {
                return +1;
            };

            return 0;
        };

        return +1;
    });

    for (let i = 0; i < TableRowSortingArray.length; i++) {
        $(`tr[data-tasks-plan-rowid="${TableRowSortingArray[i].RowID}"]`).appendTo($(`TasksTableBody${value}`));
    };

    // TODO: Figure out how to trigger the sortable update event so we don't have to duplicate code.
    ValidateTasksPlanningTable();
    UnsavedChanges = true;
};