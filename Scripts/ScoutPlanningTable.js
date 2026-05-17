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