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

for (let i = 0; i < ItemsInfo.length; i++) {
    let Item = ItemsInfo[i];

    if (Object.hasOwn(BannerGlobalDates, Item.BannerID)) {
        Item.GlobalStartDate = moment(BannerGlobalDates[Item.BannerID][0], "MMM DD YYYY").toDate();
        Item.GlobalEndDate = moment(BannerGlobalDates[Item.BannerID][1], "MMM DD YYYY").toDate();
    }
    else if (!Object.hasOwn(Item, 'GlobalStartDate')) {
        let BannerLength = DateDiff(Item.JPStartDate, Item.JPEndDate);

        let JPLaunchBannerStartDateDiff = DateDiff(JPLaunchDate, Item.JPStartDate);
        let GlobalLaunchBannerStartDateDiff = Math.round(JPLaunchBannerStartDateDiff/GlobalAccelRate);

        Item.GlobalStartDate = DateAdd(GlobalLaunchDate, GlobalLaunchBannerStartDateDiff);
        Item.GlobalEndDate = DateAdd(Item.GlobalStartDate, BannerLength);
    };

    Item.BannerLength = DateDiff(Item.GlobalStartDate, Item.GlobalEndDate);
    Item.DaysLeft = DateDiff(Today, Item.GlobalEndDate);
    Item.WeekDiff = Math.floor(DateDiff(Today, Item.GlobalEndDate) / 7);
    Item.MonthDiff = 12*(Item.GlobalEndDate.getFullYear() - Today.getFullYear()) + (Item.GlobalEndDate.getMonth() - Today.getMonth());

    if (Item.Disabled != true) {
        CurrentBannerItemCount++;

        let OpenIndex = Item.Name.indexOf('(');
        CurrentItemSuffix = Item.Name.substring(OpenIndex+1, Item.Name.length-1) // Checks for things like (Christmas) or (Summer);

        if (FirstBannerItem) {
            GenericName = Item.Name;
        }
        else {
            GenericName += `<br>${Item.Name}`;

            if (OpenIndex < 0 || CurrentItemSuffix != PreviousItemSuffix) {
                ConsistentSuffix = false;
            };
        };
        FirstBannerItem = false;
        PreviousItemSuffix = CurrentItemSuffix;
    };

    if (i + 1 == ItemsInfo.length || Item.BannerID != ItemsInfo[i+1].BannerID) {
        if (CurrentBannerItemCount > 0) {
            /* If the banner does not already have a specified name, then we will check if there is a consistent suffix across
            the banner items, such as (Christmas) or (Summer). If there is then we will use that for the banner name. If there isn't,
            then we will just use the names of each item in the banner. We will lastly append the banner's date range to it's name. */
            if (!Object.hasOwn(BannersInfo, Item.BannerID)) {
                if (ConsistentSuffix && CurrentBannerItemCount > 1 && CurrentItemSuffix.substring(0, 2) != 'SR' && CurrentItemSuffix.substring(0, 3) != 'SSR') {
                    BannersInfo[Item.BannerID] = {Name: CurrentItemSuffix};
                }
                else {
                    BannersInfo[Item.BannerID] = {Name: GenericName};
                };
            };
            BannersInfo[Item.BannerID].Name += `<br>${moment(Item.GlobalStartDate, "YYYY-MM-DD").format('L')} - ${moment(Item.GlobalEndDate, "YYYY-MM-DD").format('L')}`;

            BannersInfo[Item.BannerID].Type      = Item.Type;
            BannersInfo[Item.BannerID].StartDate = Item.GlobalStartDate;
            BannersInfo[Item.BannerID].EndDate   = Item.GlobalEndDate;
        }

        GenericName = '';
        FirstBannerItem = true;
        ConsistentSuffix = true;
        CurrentBannerItemCount = 0;
    };
};

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

function CalculateRoundRewards(ScoutConfig, Round) {
    /* CM Rewards will be given out based on how many races were won out of five, for a given set. Since the amount of
    rewards per win increases at a non-linear rate, and for simplicity's sake, we will estimate the results using max
    and min wins per set. The max wins per set will represent a rate that would be just above the win rate. Similar for
    the min wins per set. (ex: If our win rate is 30 then our max is 2 and min is 1 as 2/5 -> 40% and 1/5 -> 20%.) */
    MaxWinsPerFinish = 1;
    while (ScoutConfig[`CMR${Round}WR`] > 20*MaxWinsPerFinish) {
        MaxWinsPerFinish += 1
    };
    MinWinsPerFinish = MaxWinsPerFinish - 1;

    // We will now try and approximate the win rate using our max, min, and the number of sets run.
    let MaxWinSets = ScoutConfig[`CMR${Round}Sets`]
    let MinWinSets = ScoutConfig[`CMR${Round}Sets`] - MaxWinSets;
    while ( 20 * ( (MaxWinsPerFinish*MaxWinSets + MinWinsPerFinish*MinWinSets) / ScoutConfig[`CMR${Round}Sets`] ) > ScoutConfig[`CMR${Round}WR`] ) {
        MaxWinSets -= 1
        MinWinSets += 1
    };

    // League: 1 = Open, 2 = Graded
    // Group: 1 = A, 2 = B
    let Rewards;
    if (ScoutConfig.CMLeague == 1 && Round == 1) {
        Rewards = [5, 10, 15, 20, 25, 30];
    }
    else if (ScoutConfig.CMLeague == 1 && Round == 2 && ScoutConfig.CMR2Group == 1) {
        Rewards = [15, 20, 30, 40, 50, 100];
    }
    else if (ScoutConfig.CMLeague == 1 && Round == 2 && ScoutConfig.CMR2Group == 2) {
        Rewards = [10, 15, 20, 30, 40, 50];
    }
    else if (ScoutConfig.CMLeague == 2 && Round == 1) {
        Rewards = [10, 15, 20, 30, 40, 50];
    }
    else if (ScoutConfig.CMLeague == 2 && Round == 2 && ScoutConfig.CMR2Group == 1) {
        Rewards = [20, 30, 40, 50, 75, 150];
    }
    else if (ScoutConfig.CMLeague == 2 && Round == 2 && ScoutConfig.CMR2Group == 2) {
        Rewards = [15, 20, 30, 40, 50, 100];
    };

    return MaxWinSets*Rewards[MaxWinsPerFinish] + MinWinSets*Rewards[MinWinsPerFinish];
};

function SavingsCalculator(ScoutConfig, BannerPlan) {
    // Free Carats are a currency that can be used to acquire new Umamusumes (Umas) or support cards, in a process called scouting.
    let FC = ScoutConfig.FC;

    // Uma/Card tickets, collectively referred to as pink tickets, can be used to make scouts on their corresponding types of banners.
    let UmaTickets = ScoutConfig.UmaTickets;
    let CardTickets = ScoutConfig.CardTickets;

    /* Rainbow crystals can be used to limit break any card. In other words,
    they can effectively be exchanged for a copy of any card you already have.
    20 rainbow crystal shards can be used to create a rainbow crystal. */
    let RainbowCrystals = ScoutConfig.RainbowCrystals;
    let RainbowCrystalShards = ScoutConfig.RainbowCrystalShards;

    // Daily Missions + Daily Carat Pack (if purchased).
    FC += DateDiff(Today, BannerPlan.GlobalEndDate) * ( 75 + (ScoutConfig.HasDailyCaratPack ? 50 : 0) );

    // 150 free carats will be earned from the daily login bonus over the course of a week.
    // TODO: Will have to add a field to specify what day the login bonus gives which rewards, for individual users, since that can affect calcs.
    FC += 150 * BannerPlan.WeekDiff;

    /* Team Trials - Provides a reward each Monday based on your class. The day of the week function will
    set Monday as 1 and Sunday as 7. This means that if the current DayOfWeek is greater than the end
    date's DayOfWeek then we must loop around to a Monday, one more time, in order to reach the end date. */
    let TeamTrialCarats;
    switch (ScoutConfig.TeamTrialsClass) {
        case 1: TeamTrialCarats = 0;   break;
        case 2: TeamTrialCarats = 35;  break;
        case 3: TeamTrialCarats = 75;  break;
        case 4: TeamTrialCarats = 150; break;
        case 5: TeamTrialCarats = 225; break;
        case 6: TeamTrialCarats = 375; break;
    };
    FC += TeamTrialCarats * ( BannerPlan.WeekDiff + (DayOfWeek(Today) > DayOfWeek(BannerPlan.GlobalEndDate) ? 1 : 0) );

    // Each month there will be an event that gives out carats and pink tickets for completing stories, bingo cards, and reaching certain event point milestones.
    
    // For the sake of simplicity, all event rewards will be given on the last day of the event.
    let NumberOfEvents = 0;
    for (let i = StartingEvent; i < StoryEvents.length; i++) {
        if (StoryEvents[i].JPEndDate <= BannerPlan.JPEndDate) {
            NumberOfEvents++;
        }
        else {
            break;
        };
    };

    if (ScoutConfig.CompletesEventStories) {
        FC += NumberOfEvents * 210
    };

    if (ScoutConfig.CompletesEventBingoCards) {
        FC += NumberOfEvents * 450
    };

    for (let i = 1; i <= ScoutConfig.ExpectedEventPoints; i++) {
        let Event = StoryEventRewards[i-1]

        switch (Event.RewardType.Value) {
            case StoryEventRewardTypes.Carat.Value:
                FC += NumberOfEvents * Event.Quantity;
                break;
            case StoryEventRewardTypes.UmaTicket.Value:
                UmaTickets += NumberOfEvents * Event.Quantity;
                break;
            case StoryEventRewardTypes.CardTicket.Value:
                CardTickets += NumberOfEvents * Event.Quantity;
                break;
            case StoryEventRewardTypes.CrystalShard.Value:
                RainbowCrystalShards += NumberOfEvents * Event.Quantity;
                break;
        };
    };

    // Champion meets are recurring tournaments that give out rewards based on how well you perform.

    // For the sake of simplicity, all CM rewards will be given on the last day of the CM.
    let NumberOfCMs = 0;

    for (let i = StartingCM; i < ChampionsMeetings.length; i++) {
        let CM = ChampionsMeetings[i]

        if (
            (Object.hasOwn(CM, 'GlobalEndDate') && ChampionsMeetings[i].GlobalEndDate <= BannerPlan.GlobalEndDate)
            || (!Object.hasOwn(CM, 'GlobalEndDate') && ChampionsMeetings[i].JPEndDate <= BannerPlan.JPEndDate)
        ) {
            NumberOfCMs++;
        }
        else {
            break;
        };
    };

    FC += NumberOfCMs * CalculateRoundRewards(ScoutConfig, 1);
    FC += NumberOfCMs * CalculateRoundRewards(ScoutConfig, 2);

    // You can run up to 8 sets per round. The first 6 are free, but the last 2 will cost 30 FC each.
    FC -= NumberOfCMs * 30 * Math.max(0, ScoutConfig.CMR1Sets - 6);
    FC -= NumberOfCMs * 30 * Math.max(0, ScoutConfig.CMR2Sets - 6);

    if (ScoutConfig.CMR3Qualify) {
        // We don't need to run the function for round 3 since its just one race. Round 3 will also award pink tickets.
        // League: 1 = Open, 2 = Graded
        // Group: 1 = A, 2 = B
        if (ScoutConfig.CMLeague == 1 && ScoutConfig.CMR3Group == 1) {        
            UmaTickets  += NumberOfCMs * [3, 2, 1][ScoutConfig.CMR3Placement-1];
            CardTickets += NumberOfCMs * [3, 2, 1][ScoutConfig.CMR3Placement-1];
            FC          += NumberOfCMs * [900, 700, 500][ScoutConfig.CMR3Placement-1];
        }
        else if (ScoutConfig.CMLeague == 1 && ScoutConfig.CMR3Group == 2) { 
            UmaTickets  += NumberOfCMs * [2, 2, 1][ScoutConfig.CMR3Placement-1];
            CardTickets += NumberOfCMs * [1, 0, 0][ScoutConfig.CMR3Placement-1];
            FC          += NumberOfCMs * [500, 300, 200][ScoutConfig.CMR3Placement-1];
        }
        else if (ScoutConfig.CMLeague == 2 && ScoutConfig.CMR3Group == 1) {
            UmaTickets  += NumberOfCMs * [5, 4, 3][ScoutConfig.CMR3Placement-1];
            CardTickets += NumberOfCMs * [5, 4, 3][ScoutConfig.CMR3Placement-1];
            FC          += NumberOfCMs * [2000, 1500, 1000][ScoutConfig.CMR3Placement-1];
        }
        else if (ScoutConfig.CMLeague == 2 && ScoutConfig.CMR3Group == 2) {
            UmaTickets  += NumberOfCMs * [3, 2, 1][ScoutConfig.CMR3Placement-1];
            CardTickets += NumberOfCMs * [3, 2, 1][ScoutConfig.CMR3Placement-1];
            FC          += NumberOfCMs * [1000, 750, 500][ScoutConfig.CMR3Placement-1];
        };
    };

    // Club Rewards - Provides a reward each month based on your ranking.
    let ExpectedClubCarats = 0;
    switch (ScoutConfig.ExpectedClubRank) {
        case 1:  ExpectedClubCarats = 4500; break;
        case 2:  ExpectedClubCarats = 3600; break;
        case 3:  ExpectedClubCarats = 3150; break;
        case 4:  ExpectedClubCarats = 2700; break;
        case 5:  ExpectedClubCarats = 2250; break;
        case 6:  ExpectedClubCarats = 1800; break;
        case 7:  ExpectedClubCarats = 1350;  break;
        case 8:  ExpectedClubCarats = 900;  break;
        case 9:  ExpectedClubCarats = 450;  break;
        case 10: ExpectedClubCarats = 225;  break;
        case 11: ExpectedClubCarats = 0;    break;
    };
    FC += ExpectedClubCarats * BannerPlan.MonthDiff;

    /* Each month certain shops will be restocked with Pink Tickets. We will purchase them every month if we can given the currently held
    amount of currency. Since there are other valuable resources that can be purchased from these shops, we will factor in their cost as well.
    The friend point shop will allow you to buy 1 of each type of pink ticket per month, while the cleat shop will allow you to buy 2.*/
    let TicketCost = {FriendPoints: 20000, RainbowCleats: 2, GoldCleats: 10, SilverCleats: 50};

    let BookHintCost = 4*1000 + 2*2000 + 2*4000 + 6000;
    // Tickets purchased during months where you can buy out the shop.
    let WholeMonthTickets = Math.floor(ScoutConfig.FriendPoints/(2*TicketCost.FriendPoints + BookHintCost));
    let RemainingFriendPoints = ScoutConfig.FriendPoints % (2*TicketCost.FriendPoints + BookHintCost) - BookHintCost;
    UmaTickets += Math.min(BannerPlan.MonthDiff, WholeMonthTickets + (RemainingFriendPoints > TicketCost.FriendPoints ? 1 : 0));
    CardTickets += Math.min(BannerPlan.MonthDiff, WholeMonthTickets);

    /* For cleats we will buy one SR Ticket each month in addition
    to the Pink Tickets and they cost the same as the Pink Tickets. */
    let CleatTypes = ['Rainbow', 'Gold', 'Silver'];
    for (let i = 0; i < CleatTypes.length; i++) {
        let WholeMonthTickets = 2 * Math.floor( ScoutConfig[`${CleatTypes[i]}Cleats`] / (5*TicketCost[`${CleatTypes[i]}Cleats`]) );

        let RemainingCleats = ScoutConfig[`${CleatTypes[i]}Cleats`] % (5*TicketCost[`${CleatTypes[i]}Cleats`]);
        let RemainingCleatTickets = Math.max(0, Math.floor( RemainingCleats / TicketCost[`${CleatTypes[i]}Cleats`] ) - 1);

        UmaTickets += Math.min(2*BannerPlan.MonthDiff, WholeMonthTickets + Math.min(2, RemainingCleatTickets));
        CardTickets += Math.min(2*BannerPlan.MonthDiff, WholeMonthTickets + (RemainingCleatTickets > 2 ? 1 : 0));        
    };

    /* When a new Uma comes out, you will be able to view the first 4 chapters of there
    story, even if you haven't pulled them, and will receive 80 FC for doing so. */
    for (let i = 0; i < ItemsInfo.length; i++) {
        if (
            ItemsInfo[i].GlobalStartDate > Today
            && ItemsInfo[i].Disabled != true
            && ItemsInfo[i].GlobalStartDate <= BannerPlan.GlobalEndDate
            && ItemsInfo[i].IsNew
            && ItemsInfo[i].Type == BannerTypes['Uma'].Value
            && ItemsInfo[i].Name.at(-1) != ')' // Hacky way of making sure this isn't an alternate version of an Uma that's already been released. ex: Oguri Cap (Christmas)
        ) {                    
            FC += 80
        }
    };

    // The calculator is not preprogrammed for temporary login bonuses, so users will be able to add them in on their own and this code block will handle the calcs for them.
    for (let i = 0; i < ScoutConfig.LoginBonusArray.length; i++) {
        let BonusRow = ScoutConfig.LoginBonusArray[i];
        let RewardInterval = BonusRow.Frequency == 1 ? 1 : 7; // Frequency: 1=Daily, 2=Weekly
        let StartDate = moment(BonusRow.StartDate).toDate();
        let EndDate = DateAdd(StartDate, RewardInterval * (BonusRow.Logins-1));

        if (StartDate <= BannerPlan.GlobalEndDate && EndDate > Today)  {
            let Claims = BonusRow.Logins;

            if (Today >= StartDate) {
                Claims = Math.ceil(DateDiff(Today, EndDate) / RewardInterval);
            };

            if (BannerPlan.GlobalEndDate < EndDate) {
                Claims -= Math.ceil(DateDiff(BannerPlan.GlobalEndDate, EndDate) / RewardInterval);
            };

            switch (BonusRow.ItemType) {
                case 1: FC                   += Claims * BonusRow.ItemQuantity; break;
                case 2: UmaTickets           += Claims * BonusRow.ItemQuantity; break;
                case 3: CardTickets          += Claims * BonusRow.ItemQuantity; break;
                case 4: RainbowCrystals      += Claims * BonusRow.ItemQuantity; break;
                case 5: RainbowCrystalShards += Claims * BonusRow.ItemQuantity; break;
            };
        };
    };

    /* Paid Carats are a paid currency that can be converted to Free Carats at a 1:1 rate. They can also be used to make a heavily discounted
    scout (50 PC), once per day. For simplicity's sake, the calculator will currently only allow these to be used on the once daily scout. */
    // MaxPCScouts does not focus on how many pulls could be made given the banner's duration, but instead focuses on how many PC scouts could possibly be made all together by it's end date.
    let MaxPCScouts = Math.floor(ScoutConfig.PC/50);

    // A monthly purchase that will reward 500 PC (10 scouts) upfront and 50 FC every day for the next 30 days.
    if (ScoutConfig.HasDailyCaratPack && BannerPlan.GlobalEndDate >= moment(ScoutConfig.NextCaratPackRenewalDate)) {

        let RenewalToEndDateDiff = DateDiff(moment(ScoutConfig.NextCaratPackRenewalDate), BannerPlan.GlobalEndDate);

        /* We will add 10 PC scouts for every renewal date between the next renewal date and the banner's end date, except for the last renewal
        date between the two. For the last one, we need to check how many of the pulls could actually be used by the banner's end date. */
        MaxPCScouts += 10 * Math.floor(RenewalToEndDateDiff/30) + Math.min(10, RenewalToEndDateDiff % 30 + 1);
    };

    return {
        MaxFCScouts: Math.floor(FC/150),
        MaxPCScouts: MaxPCScouts,
        MaxPinkTicketScouts: BannerPlan.Type == BannerTypes.Uma.Value ? UmaTickets : CardTickets,
        MaxRainbowCrystals: RainbowCrystals + Math.floor(RainbowCrystalShards/20)
    };
};

let TotalFCScouts;
let TotalPCScouts;
let UmaTicketsSpent;
let CardTicketsSpent;
let RainbowCrystalsSpent;

function RunAndEvaluateScoutSimulations(ScoutConfig) {
    let Start = Date.now();
    let Successes = 0;
    let ScoutItemResults = new Array(ScoutConfig.ActiveScoutItems).fill(0);

    let TrialCount;
    for (TrialCount = 0; TrialCount < Trials; TrialCount++) {
        TotalFCScouts = 0;
        TotalPCScouts = 0;
        UmaTicketsSpent = 0;
        CardTicketsSpent = 0;
        RainbowCrystalsSpent = 0;

        let ScoutItemNumber = 0;
        let MissedScoutItems = false;
        for (let i = 0; i < ScoutConfig.ActiveScoutPlanArray.length; i++) {

            // An array that lists how many items are still needed to reach each goal.
            let ItemsRemaining = ScoutSimulator(ScoutConfig, ScoutConfig.ActiveScoutPlanArray[i]);

            for (let j = 0; j < ItemsRemaining.length; j++) {
                if (ItemsRemaining[j] > 0) {
                    MissedScoutItems = true;
                }
                else {
                    ScoutItemResults[ScoutItemNumber]++;
                };

                ScoutItemNumber++;
            };
        };

        if (!MissedScoutItems) {
            Successes++
        };

        if (Date.now() - Start > 5000) { // Sets a 5 second time limit on calcs.
            TrialCount += 1
            break;
        };
    };

    for (let i = 0; i < ScoutItemResults.length; i++) {
        ScoutItemResults[i] = ((ScoutItemResults[i] / TrialCount)*100).toFixed(1)+'%';
    };

    return ({
        TotalSuccessRate: ((Successes / TrialCount)*100).toFixed(1)+'%',
        ScoutItemResults: ScoutItemResults
    });
};

// TODO: Do we need to pass ScoutConfig?
function ScoutSimulator(ScoutConfig, BannerPlan) {
    let ItemsRemaining = BannerPlan.ItemsRemaining.slice();
    let TotalItemsRemaining = BannerPlan.TotalItemsRemaining;

    let Scouts = 0;
    let ExchangePoints = BannerPlan.ExchangePoints;
    
    // There is a lot of really annoying/complicated logic for the rainbow crystals since they can't be used unless you own a copy of the card.
    // We will also take heavy advantage of the fact that no support card banner has had more than two rate up SSRs yet.
    let arrItemHasAtleastOneCopy;
    let DistinctOwnedItems = 0;
    let UseableRainbowCrystals = 0;
    let MaxUseableRainbowCrystals = 0;

    if (BannerPlan.Type == BannerTypes.Card.Value && BannerPlan.UseRainbowCrystals) {
        arrItemHasAtleastOneCopy = [BannerPlan.CardOwned1, BannerPlan.CardOwned2];
        DistinctOwnedItems += BannerPlan.CardOwned1 + BannerPlan.CardOwned2;
        MaxUseableRainbowCrystals = Math.max(0, BannerPlan.MaxRainbowCrystals - RainbowCrystalsSpent);
    }
    else {
        arrItemHasAtleastOneCopy = new Array(ItemsRemaining.length).fill(false); // Don't care about whats owned if we aren't using crystals.
    };

    let MaxFCScouts = BannerPlan.MaxFCScouts - TotalFCScouts;
    let MaxPCScouts = Math.min( BannerPlan.DaysLeft, BannerPlan.BannerLength + 1, BannerPlan.MaxPCScouts - TotalPCScouts );
    let MaxPinkTicketScouts = BannerPlan.MaxPinkTicketScouts - (BannerPlan.Type == BannerTypes.Uma.Value ? UmaTicketsSpent : CardTicketsSpent);
    let MaxScouts = MaxFCScouts + MaxPCScouts + MaxPinkTicketScouts + BannerPlan.FreePulls;

    if (BannerPlan.Limit != '') {
        MaxScouts = Math.min(MaxScouts, BannerPlan.Limit);
    };

    let MaxScoutsRemaining = Math.min(MaxScouts-Scouts, 200*TotalItemsRemaining - ExchangePoints - 200*UseableRainbowCrystals);

    while (MaxScoutsRemaining > 0) {
        let ScoutsNeededForNextItem = Math.ceil( Math.log(Math.random()) / Math.log(1-BannerPlan.SumOfItemRates) );

        // If UseableRainbowCrystals is equal to the max then we either can use them on any copy, or we aren't using them in the first place.
        if (UseableRainbowCrystals != MaxUseableRainbowCrystals) {
            let ScoutsTillNextMileStone = Math.min(ScoutsNeededForNextItem, MaxScoutsRemaining);
            let Exchanges = Math.floor((ScoutsTillNextMileStone + ExchangePoints)/200);

            if (Exchanges + DistinctOwnedItems >= ItemsRemaining.length) {
                UseableRainbowCrystals = MaxUseableRainbowCrystals;
            }
            else {
                UseableRainbowCrystals = 0;
                for (let i = 0; i < ItemsRemaining.length; i++) {
                    if (arrItemHasAtleastOneCopy[i]) {
                        UseableRainbowCrystals = Math.min(MaxUseableRainbowCrystals, UseableRainbowCrystals + ItemsRemaining[i]);
                    }
                    else if (Exchanges > 0) {
                        UseableRainbowCrystals = Math.min(MaxUseableRainbowCrystals, UseableRainbowCrystals + ItemsRemaining[i]);
                        Exchanges -= 1
                    };
                };
            };

            MaxScoutsRemaining = Math.min(MaxScouts-Scouts, 200*TotalItemsRemaining - ExchangePoints - 200*UseableRainbowCrystals);
        };

        if (ScoutsNeededForNextItem > MaxScoutsRemaining) {
            Scouts += MaxScoutsRemaining;
            ExchangePoints += MaxScoutsRemaining;

            break;
        }
        else{
            Scouts += ScoutsNeededForNextItem;
            ExchangePoints += ScoutsNeededForNextItem;

            if (ItemsRemaining.length == 1) {
                ItemsRemaining[0] -= 1;
                TotalItemsRemaining -= 1;
                arrItemHasAtleastOneCopy[0] = 1;
                UseableRainbowCrystals = MaxUseableRainbowCrystals;
            }
            else {
                let CumulativeItemChance = 0;
                let ScoutRandomizer = Math.random() * BannerPlan.SumOfItemRates;

                for (let i = 0; i < ItemsRemaining.length; i++) {
                    CumulativeItemChance += BannerPlan.ItemRates[i];

                    if (ScoutRandomizer < CumulativeItemChance) {
                        if (ItemsRemaining[i] > 0) {
                            ItemsRemaining[i] -= 1;
                            TotalItemsRemaining -= 1;

                            if (!arrItemHasAtleastOneCopy[i]) {
                                arrItemHasAtleastOneCopy[i] = true;
                                DistinctOwnedItems += 1
                            };
                        };
                        break;
                    };
                };
            };

            MaxScoutsRemaining = Math.min(MaxScouts-Scouts, 200*TotalItemsRemaining - ExchangePoints - 200*UseableRainbowCrystals);
        };
    };

    if (Math.floor(ExchangePoints/200) + UseableRainbowCrystals >= TotalItemsRemaining) {
        RainbowCrystalsSpent += TotalItemsRemaining - Math.floor(ExchangePoints/200);

        for (let i = 0; i < ItemsRemaining.length; i++) {
            ItemsRemaining[i] = 0;
        };
    }
    else {
        for (let i = 0; i < ItemsRemaining.length; i++) {
            // We will only use exchange points and crystals on items if we they will let us hit a goal.
            if (
                ItemsRemaining[i] > 0
                && Math.floor(ExchangePoints/200) + (arrItemHasAtleastOneCopy[i] || ExchangePoints >= 200 ? UseableRainbowCrystals : 0) >= ItemsRemaining[i]
            ) {
                while (ItemsRemaining[i] > 0 && ExchangePoints >= 200) {
                    ItemsRemaining[i] -= 1;
                    ExchangePoints -= 200;
                };

                RainbowCrystalsSpent += ItemsRemaining[i];
                UseableRainbowCrystals = Math.max(0, UseableRainbowCrystals - ItemsRemaining[i]);
                ItemsRemaining[i] = 0;
            };
        };
    };

    Scouts -= BannerPlan.FreePulls;
    if (Scouts > 0) {
        CalcFCScouts(BannerPlan.Type, Scouts, MaxPCScouts, MaxPinkTicketScouts);
    };

    return ItemsRemaining;
};

// Since we will want to use both paid carats and pink tickets first, this function will determine how many free carats were actually used.
function CalcFCScouts(ScoutItemType, Scouts, MaxPCScouts, MaxPinkTicketScouts) {
    let PCScouts = Math.min(Scouts, MaxPCScouts);
    TotalPCScouts += PCScouts;

    let PinkTicketScouts = Math.min(Scouts - PCScouts, MaxPinkTicketScouts);
    if (ScoutItemType == BannerTypes.Uma.Value) {
        UmaTicketsSpent += PinkTicketScouts;
    }
    else {
        CardTicketsSpent += PinkTicketScouts;
    };

    TotalFCScouts += (Scouts - PCScouts - PinkTicketScouts);
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