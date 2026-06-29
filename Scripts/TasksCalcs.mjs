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

    for (let i = 0; i < ScoutConfig.TasksPlanArray.length; i++) {
        let BannerPlan = ScoutConfig.TasksPlanArray[i];
        let Row = $(`tr[data-tasks-plan-rowid="${BannerPlan.RowID}"]`)

        // console.log(moment(`${BannerPlan.DueDate} ${BannerPlan.DueTime}`).format('MM/DD/YYYY hh:mm:ss A'))
        
        if (!BannerPlan.Completed) {
            let NewRow = `
                <tr class="ScoutPlanResultsRow">
                    <td>${BannerPlan.Item}</td>
                    <td>
                        ${moment(`${BannerPlan.DueDate} ${BannerPlan.DueTime}`).format('MM/DD/YYYY hh:mm A')}
                        <br>
                        ${Row.find('.TasksPlanCountdown').html()}
                    </td>
                    <td>${BannerPlan.Item}</td>
                </tr>
            `
            $('#TasksPlanningResultsBody').append($(NewRow));
        }

    };

    $('#ScoutResultsTable').show();
};