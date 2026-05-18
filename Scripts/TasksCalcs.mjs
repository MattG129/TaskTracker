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

function ScoutPlanningCalculator(ScoutConfig) {
    ScoutConfig.ActiveScoutItems = 0;
    ScoutConfig.ActiveScoutPlanArray = [];

    for (let i = 0; i < ScoutConfig.ScoutPlanArray.length; i++) {
        if (ScoutConfig.ScoutPlanArray[i].Active) {

            let ScoutPlan = ScoutConfig.ScoutPlanArray[i];

            let BannerPlan = {
                Items: [],
                Limit: ScoutPlan.Limit,
                ExchangePoints: ScoutPlan.ExchangePoints,
                FreePulls: Number(ScoutPlan.FreePulls),
                UseRainbowCrystals: ScoutPlan.UseRainbowCrystals,
                CardOwned1: ScoutPlan.CardOwned1,
                CardOwned2: ScoutPlan.CardOwned2,
                ItemsRemaining: [],
                TotalItemsRemaining: 0,
                ItemRates: [],
                SumOfItemRates: 0
            };
            for (let j = 0; j < ScoutPlan.Items.length; j++) {
                ScoutPlan.Goals[ScoutPlan.Items[j]] = Number(ScoutPlan.Goals[ScoutPlan.Items[j]]); // Need to make sure this is converted from a string to a number.

                if (ScoutPlan.Goals[ScoutPlan.Items[j]] > 0) {
                    BannerPlan.Items.push({
                        ID: ScoutPlan.Items[j],
                        Goal: ScoutPlan.Goals[ScoutPlan.Items[j]]
                    });

                    BannerPlan.ItemsRemaining.push(ScoutPlan.Goals[ScoutPlan.Items[j]]);
                    BannerPlan.TotalItemsRemaining += ScoutPlan.Goals[ScoutPlan.Items[j]];

                    BannerPlan.ItemRates.push(ItemsInfo[ScoutPlan.Items[j]].Rate);
                    BannerPlan.SumOfItemRates += ItemsInfo[ScoutPlan.Items[j]].Rate;
                };
            };

            if (BannerPlan.Items.length > 0) {
                Object.assign(BannerPlan, ItemsInfo[ScoutPlan.Items[0]]); // We can use item 0 since all of them will have the same date info.

                let SavingsResults = SavingsCalculator(ScoutConfig, BannerPlan);
                Object.assign(BannerPlan, SavingsResults);

                ScoutConfig.ActiveScoutPlanArray.push(BannerPlan);
                ScoutConfig.ActiveScoutItems += ScoutPlan.Items.length;
            };
        };
    };

    let ScoutsResults = RunAndEvaluateScoutSimulations(ScoutConfig);

    RenderScoutResults(ScoutConfig, ScoutsResults);
};

function RenderScoutResults(ScoutConfig, ScoutsResults) {
    $('#ScoutResultsTable .ScoutPlanResultsRow').remove();

    let PCScouts = 0;
    let UmaTicketScouts = 0;
    let CardTicketScouts = 0;
    let FCScouts = 0;

    let ScoutItemNumber = 0;

    for (let i = 0; i < ScoutConfig.ActiveScoutPlanArray.length; i++) {
        let BannerPlan = ScoutConfig.ActiveScoutPlanArray[i];

        let First = true;
        let MaxScouts;
        let ThisBannerPCScouts = 0;
        let MaxPCScouts = Math.min( DateDiff(Today, BannerPlan.GlobalEndDate), BannerPlan.BannerLength + 1, BannerPlan.MaxPCScouts - PCScouts );
        let FreePulls = BannerPlan.FreePulls;
        for (let j = 0; j < BannerPlan.Items.length; j++) {

            let Item = BannerPlan.Items[j];

            if (First) {
                MaxScouts = MaxPCScouts;
                MaxScouts += BannerPlan.MaxPinkTicketScouts - (BannerPlan.Type == BannerTypes.Uma.Value ? UmaTicketScouts : CardTicketScouts);
                MaxScouts += BannerPlan.MaxFCScouts - FCScouts;
                MaxScouts += BannerPlan.FreePulls;

                if (BannerPlan.Limit != '') {
                    MaxScouts = Math.min(MaxScouts, BannerPlan.Limit)
                };
            };

            for (let k = 0; k < Item.Goal; k++) {
                if (FreePulls > 0) {
                    FreePulls -= 1;
                }
                else if (MaxPCScouts > ThisBannerPCScouts) {
                    ThisBannerPCScouts += 1;
                }
                else if (BannerPlan.Type == BannerTypes.Uma.Value && BannerPlan.MaxPinkTicketScouts > UmaTicketScouts) {
                    UmaTicketScouts += 1;
                }
                else if (BannerPlan.Type == BannerTypes.Card.Value && BannerPlan.MaxPinkTicketScouts > CardTicketScouts) {
                    CardTicketScouts += 1;
                }
                else if (BannerPlan.MaxFCScouts > FCScouts) {
                    FCScouts += 1;
                };
            };

            let NewRow = '<tr class="ScoutPlanResultsRow">'
            if (First) {
                NewRow +=  `<td rowspan="${BannerPlan.Items.length}">${BannersInfo[ ItemsInfo[Item.ID].BannerID ].Name}</td>
                            <td rowspan="${BannerPlan.Items.length}">${MaxScouts}</td>`
            };
            NewRow +=      `<td>${ItemsInfo[Item.ID].Name}</td>
                            <td>${Item.Goal}</td>
                            <td>${ScoutsResults.ScoutItemResults[ScoutItemNumber]}</td>
                          </tr>`

            $('#ScoutPlanningResultsBody').append($(NewRow));

            ScoutItemNumber++;
            First = false;
        };
        PCScouts += ThisBannerPCScouts;
    };

    $('#ScoutResultsTable tfoot').append($(
        `<tr class="ScoutPlanResultsRow">
            <td colspan="5"><b>Chance of reaching all scout goals: ${ScoutsResults.TotalSuccessRate}</b></td>
        </tr>`
    ));

    $('#ScoutResultsTable').show();
};