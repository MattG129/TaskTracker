const Trials = 10**6;

const Today = new Date(); // TODO: Update date/banner calcs to factor in if day/banner has changed between when the page was loaded and when calcs are run.
Today.setHours(0,0,0,0);

const JPLaunchDate = moment('23 Feb 2021', "DD MMM YYYY").toDate()
const GlobalLaunchDate = moment('25 Jun 2025', "DD MMM YYYY").toDate()
const GlobalAccelRate = 1.42;

let FirstBannerItem = true;
let GenericName;
let CurrentItemSuffix;
let PreviousItemSuffix;
let ConsistentSuffix = true;
let CurrentBannerItemCount = 0;

function DateAdd(date, days) {
    let NewDate = new Date(date);
    
    NewDate.setDate(date.getDate() + days);
    
    return NewDate;
};

function DateDiff(DateFrom, DateTo) {
    return Math.floor((DateTo - DateFrom)/(1000 * 60 * 60 * 24));
};

function DayOfWeek(Date) {
    let DOW = moment(Date).day()
    
    // We want to treat Monday as the start of the week and Sunday as the end.
    return (DOW == 0 ? 7 : DOW);
};

function TasksPlanningCalculator(ScoutConfig) {
    // console.log(ScoutConfig.TasksPlanArray);

    ScoutConfig.TasksPlanArray.sort((a, b) => {
        if (a.DueDate == '' && b.DueDate != '') {return 1};
        if (a.DueDate != '' && b.DueDate == '') {return -1};

        let dateCompare = a.DueDate.localeCompare(b.DueDate);

        if (dateCompare !== 0) {
            return dateCompare;
        }

        return a.DueTime.localeCompare(b.DueTime);
    });
    // console.log(ScoutConfig.TasksPlanArray);

    ScoutConfig.ActiveScoutItems = 0;
    ScoutConfig.ActiveScoutPlanArray = [];

    RenderScoutResults(ScoutConfig);
};

function RenderScoutResults(ScoutConfig) {
    $('#ScoutResultsTable .ScoutPlanResultsRow').remove();

    $('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow TotalWithDeadline"></tr>'));    

    let Tomorrow = moment(new Date().getTime()).add(1, 'days');
    let NextWeek = moment(new Date().getTime()).add(7, 'days');
    let NextMonth = moment(new Date().getTime()).add(1, 'months');
    
    let DueIn = {NoDueDate: 0, Overdue: 0, Tomorrow: 0, ThisWeek: 0, ThisMonth: 0, MoreThanMonth: 0}
    
    for (let i = 0; i < ScoutConfig.TasksPlanArray.length; i++) {
        let BannerPlan = ScoutConfig.TasksPlanArray[i];
        let CorrespondingRow = $(`tr[data-tasks-plan-rowid="${BannerPlan.RowID}"]`)

        if (!$('#HideCompletedFromReport').prop('checked') || !BannerPlan.Completed) {
            let Deadline = moment(`${BannerPlan.DueDate} ${BannerPlan.DueTime}`);

            // TOOD: See if this, and related code, can be made more programmatic.
            if (BannerPlan.DueDate == '') {
                if (DueIn.NoDueDate == 0) {$('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow NoDueDateSectionHeader"></tr>'))};
                DueIn.NoDueDate++;
            }
            else if (Deadline < new Date().getTime()) {
                if (DueIn.Overdue == 0) {$('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow OverdueSectionHeader"></tr>'))};
                DueIn.Overdue++;
            }
            else if (Deadline < Tomorrow) {
                if (DueIn.Tomorrow == 0) {$('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow TomorrowSectionHeader"></tr>'))};
                DueIn.Tomorrow++;
            }
            else if (Deadline < NextWeek) {
                if (DueIn.ThisWeek == 0) {$('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow ThisWeekSectionHeader"></tr>'))};
                DueIn.ThisWeek++;
            }
            else if (Deadline < NextMonth) {
                if (DueIn.ThisMonth == 0) {$('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow ThisMonthSectionHeader"></tr>'))};
                DueIn.ThisMonth++;
            }
            else {
                if (DueIn.MoreThanMonth == 0) {$('#TasksPlanningResultsBody').append($('<tr class="ScoutPlanResultsRow MoreThanMonthSectionHeader"></tr>'))};
                DueIn.MoreThanMonth++;
            };

            let NewRow = `
                <tr class="ScoutPlanResultsRow">
                    <td>${BannerPlan.Item}</td>
                    <td data-tasks-plan-rowid=${BannerPlan.RowID}></td>
                    <td class="td-label">
                        <label class="td-label">
                            <input type="checkbox" class="TableField form-check-input" ${BannerPlan.Completed ? 'checked':''} onclick="
                                $('tr[data-tasks-plan-rowid=${BannerPlan.RowID}]').find('.TasksPlanCompleted').prop('checked', $(this).prop('checked')).change();
                                CheckForUnsavedChanges();
                            ">
                        </label>
                    </td>
                    <td>${BannerPlan.Notes}</td>
                </tr>
            `
            $('#TasksPlanningResultsBody').append($(NewRow));
        };
    };

    let DueTomorrowCumulative = DueIn.Overdue + DueIn.Tomorrow;
    let DueThisWeekCumulative = DueIn.Overdue + DueIn.Tomorrow + DueIn.ThisWeek;
    let DueThisMonthCumulative = DueIn.Overdue + DueIn.Tomorrow + DueIn.ThisWeek + DueIn.ThisMonth;
    
    $('tr.TotalWithDeadline').html(`<td colspan=4><b>Total tasks with deadlines: ${DueThisMonthCumulative + DueIn.MoreThanMonth}</b></td>`);
    
    $('tr.NoDueDateSectionHeader').html(`<td colspan=4><b>Tasks with no due date: ${DueIn.NoDueDate}</b></td>`);
    $('tr.OverdueSectionHeader').html(`<td colspan=4><b>Overdue tasks: ${DueIn.Tomorrow}</b></td>`);
    $('tr.TomorrowSectionHeader').html(`<td colspan=4><b>Tasks due in a day: ${DueIn.Tomorrow}${DueTomorrowCumulative > DueIn.Tomorrow ? ` (${DueTomorrowCumulative})`:''}</b></td>`);
    $('tr.ThisWeekSectionHeader').html(`<td colspan=4><b>Tasks due in a week: ${DueIn.ThisWeek}${DueThisWeekCumulative > DueIn.ThisWeek ? ` (${DueThisWeekCumulative})`:''}</b></td>`);
    $('tr.ThisMonthSectionHeader').html(`<td colspan=4><b>Tasks due in a month: ${DueIn.ThisMonth}${DueThisMonthCumulative > DueIn.ThisMonth ? ` (${DueThisMonthCumulative})`:''}</b></td>`);
    $('tr.MoreThanMonthSectionHeader').html(`<td colspan=4><b>Tasks due in more than a month: ${DueIn.MoreThanMonth}</b></td>`);
    $('#TasksPlanningResultsBody').append(`
        <tr class="ScoutPlanResultsRow">
            <td colspan=4>
                <b>Total: ${DueIn.NoDueDate + DueIn.Tomorrow + DueIn.ThisWeek + DueIn.ThisMonth + DueIn.MoreThanMonth}</b>
            </td>
        </tr>
    `);

    $('#ScoutResultsTable').show();
};