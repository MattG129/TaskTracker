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
                <input type="checkbox" id="${key}AccLoadOpen" class="form-check-input">
                <label for="${key}AccLoadOpen" class="form-label">${label}</label>
            </div>
        `
    };

    $('#TasksAccordionSettings').append(TasksAccordionSettingsHTML);
});

let TasksTablesHTML = ``;
$(function() {

// console.log('yo');

    let JSONImport;
    try {
        JSONImport = JSON.parse(localStorage.getItem("TaskTrackerSessionState"));
    } catch {};

    for (let key in TasksTableTypes) {
        let value = TasksTableTypes[key].value;
        let label = TasksTableTypes[key].label;

        let Open = false;
        if (Object.hasOwn(JSONImport, `${key}AccLoadOpen`)) {
            Open = JSONImport[`${key}AccLoadOpen`];
        };

        console.log(Open, `${key}AccLoadOpen`);

        TasksTablesHTML += `
            <div class="accordion">
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${key}TasksAccordion">
                        <button class="accordion-button ${Open ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${key}TasksTableAccordionContent" aria-expanded="${Open}" aria-controls="${key}TasksTableAccordionContent">
                            <h4 class="d-block w-100 text-center">${label} Tasks</h4>
                        </button>
                    </h2>
                    <div id="${key}TasksTableAccordionContent" class="accordion-collapse ${Open ? '' : 'collapse'}" aria-labelledby="${key}TasksTableAccordion" data-bs-parent="#${key}TasksTableAccordion">
                        <div class="accordion-body" style="overflow-x: auto; padding: 5px;">
                            <table id="${key}TasksTable" class="TasksTable table table-bordered table-striped" style="font-size: min(3vw, 16px); text-align: center; border: 1px;">
                                <thead>
                                    <tr>
                                        <th style="width: 10%;">
                                            <!-- Vertical Grip -->
                                        </th>
                                        <th style="width: 20%; min-width: 80px;"> <!-- TODO: Make the accel rate dynamic. -->
                                            Banner <a data-toggle="tooltip" title="The calculator currently assumes that banners start/end at 12:00 AM (00:00). Dates are calculated based on the number of days between the Japanese server's launch and the banner's start date on that server. This number is then divided by the global acceleration rate (1.44) and is used to estimate the banner's global start date, based on the global server's launch date. The banner duration remains unchanged. For banners that have already been announced, the global dates will be entered manually."><i class="bi bi-question-circle" style="color: black;"></i></a>
                                        </th>
                                        <th style="width: 20%; min-width: 80px;">
                                            Copies <a data-toggle="tooltip" title="You can sort items by dragging and dropping them. Exchange points will be used on items in order from highest to lowest."><i class="bi bi-question-circle" style="color: black;"></i></a>
                                        </th>
                                        <th style="width: 40%; min-width: 80px;">
                                            Banner Config
                                        </th>
                                        <th style="width: 10%;">
                                            <!-- Remove Button -->
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="${key}TasksTableBody">
                                    <tr id="${key}TasksLoadingMessage" class="TasksTableLoadingMessage"><td colspan="5">Loading...</td></tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="7">
                                            <button id="AddRowButton" type="button" style="width: 100%" class="btn btn-add">
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
});

function AddScoutPlanRow() {
    let NewRow = $(
        `<tr data-scoutplan-rowid="${NewScoutPlanRowID}">
            <td class="handle" style="vertical-align: middle;"><i class="bi bi-arrows-move" style="font-size: 20px"></i></td>
            <td>
                <div class="ScoutPlanBanner" data-banner-id="0"></div>

                <button type="button" class="ScoutPlanSelector btn btn-add" style="width: 90%" data-bs-toggle="modal" data-bs-target="#SelectionModal">
                    <i class="bi bi-plus-lg" style="font-size: 20px; color: white;"></i>
                </button>

                <div class="OutOfOrderMessage TableValidation">Banner start dates must be in chronological order.</div>
                <div class="DuplicateBannerMessage TableValidation">Duplicate banner.</div>
            </td>
            <td class="ScoutPlanGoalsCell"></td>
            <td>
                <div class="row">
                    <div class="col-lg-4">
                        <label class="form-label">
                            Exchange Pts
                            <input type="number" class="ScoutPlanExchangePoints form-control" data-parsley-trigger="input" data-parsley-required="true" Value="0" min="0" data-parsley-min="0">
                        </label>
                    </div>

                    <div class="col-lg-4">
                        <label class="form-label">
                            Scout Limit
                            <input type="number" class="ScoutPlanLimit form-control" data-parsley-trigger="input" min="1" data-parsley-min="1">
                        </label>
                    </div>

                    <div class="col-lg-4">
                        <label class="form-label">
                            Free Pulls
                            <input type="number" class="ScoutPlanFreePulls form-control" data-parsley-trigger="input" data-parsley-required="true" Value="0" min="0" data-parsley-min="0">
                        </label>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-lg-4">
                        <label class="form-label">
                            <input type="checkbox" class="ScoutPlanActive form-check-input" onchange="ToggleScoutPlanRow(this, ${NewScoutPlanRowID}); ValidateScoutPlanningTable();" checked>
                            Active
                        </label>
                    </div>

                    <div class="col-lg-4">
                        <label class="form-label">
                            <input type="checkbox" class="ScoutPlanPriorityBanner form-check-input">
                            High Priority
                        </label>
                    </div>

                    <div class="col-lg-4">
                        <label class="form-label" style="display: none;">
                            <input type="checkbox" class="ScoutPlanUseRainbowCrystals form-check-input"
                                onchange="SkipTableElement(this, 'CardOwnedSkipGroup', ${NewScoutPlanRowID});"
                            >
                            Use Rainbow Uncap Crystals
                        </label>
                        <div id="CardOwnedSkipGroup${NewScoutPlanRowID}" style="display: none;">
                            <label class="form-label">
                                <input type="checkbox" class="ScoutPlanCardOwned1 form-check-input"> Card 1 Owned
                            </label>
                            <label class="form-label">
                                <input type="checkbox" class="ScoutPlanCardOwned2 form-check-input"> Card 2 Owned
                            </label>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <button type="button" class="btn btn-danger" onclick="$('tr[data-scoutplan-rowid=${NewScoutPlanRowID}]').remove(); ValidateScoutPlanningTable(); CheckForUnsavedChanges();">
                    <i class="bi bi-x-lg" style="font-weight: bold;"></i>
                </button>
            </td>
        </tr>`
    );

    $('#ScoutPlanningTableBody').append(NewRow);
    $('#ScoutPlanningTableBody').sortable("refresh");

    $(`tr[data-scoutplan-rowid=${NewScoutPlanRowID}] .ScoutPlanGoalsCell`).sortable();
    $(`tr[data-scoutplan-rowid=${NewScoutPlanRowID}] input, tr[data-scoutplan-rowid=${NewScoutPlanRowID}] select`).addClass('ScoutPlanField TableField');

    SetParsleyValidations();
    UpdateUnsavedChangesListener();
    NewScoutPlanRowID++;
};

function SortScoutPlanningTable() {
    let TableRowSortingArray = [];

    $('tr[data-scoutplan-rowid]').each(function() {
        let BannerID = $(this).find('.ScoutPlanBanner').attr('data-banner-id');

        if (BannerID == 0) { // We don't need additional info for empty rows and trying to get it from BannersInfo will cause a crash.
            TableRowSortingArray.push({RowID: $(this).attr('data-scoutplan-rowid')});
        }
        else {
            TableRowSortingArray.push({
              RowID: $(this).attr('data-scoutplan-rowid'),
              Priority: $(this).find('.ScoutPlanPriorityBanner').is(':checked'),
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
        $(`tr[data-scoutplan-rowid="${TableRowSortingArray[i].RowID}"]`).appendTo($("#ScoutPlanningTableBody"));
    };

    // TODO: Figure out how to trigger the sortable update event so we don't have to duplicate code.
    ValidateScoutPlanningTable();
    UnsavedChanges = true;
};

function SkipTableElement(Caller, SkipID, RowNumber) {
    if ($(Caller).is(':checked')) {
        $(`#${SkipID}${RowNumber}`).show();
    }
    else {
        $(`#${SkipID}${RowNumber}`).hide();
    };
};