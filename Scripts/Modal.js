$(function() {
    $('#SelectionModal').on('show.bs.modal', function(e) {
        let BannerID = $(e.relatedTarget).parent().find('.ScoutPlanBanner').attr('data-banner-id');
        CurrentModalCallingRowID = $(e.relatedTarget).parent().parent().attr('data-scoutplan-rowid');

        /* When you open the modal from an empty row the params should be empty but if you open it
        from a row with a banner then the name should be set empty but the type and bannerID should
        be set to match that banner.
        
        But if you open the modal from the same row that you just opened it from, then the params shouldn't be touched.

        Except if you open the modal from a row that just had its banner changed. In that case,
        reopening it should cause the params to act as if its being opened for the first time. */
        
        if (PreviousModalCallingRowID != CurrentModalCallingRowID) {
            $('#ItemNameFilter').val('');
            $('#BannerTypeFilter').val(0);
            $('#BannerIDFilter').val(BannerID);
        };

        PreviousModalCallingRowID = CurrentModalCallingRowID;

        UpdateModalSelection();
    });

    $('.SelectorField').on('input', function(caller) {
        UpdateModalSelection();
    });

    for (const key in BannersInfo) {
        if (BannersInfo[key].EndDate >= Today) {
            let BannerInfo = BannersInfo[key];

            $('#BannerIDFilter').append($('<option>', {
                value: key,
                text: `
                    ${BannerInfo.Type == BannerTypes.Uma.Value ? 'Uma' : 'Card'}: 
                    ${moment(BannerInfo.StartDate, "YYYY-MM-DD").format('L')} - ${moment(BannerInfo.EndDate, "YYYY-MM-DD").format('L')}
                `}
            ));
        };
    };
});


function UpdateModalSelection() {
    clearTimeout(UpdateModalTimeout);

    UpdateModalTimeout = setTimeout(function() {
        let ItemWidth = 250;
        let TableColumnLimit = Math.floor($('#SelectionModal').find('.modal-body').width()/ItemWidth);

        let Table = `<table><tr>`;
        let ItemCount = 0;
        for (i = 0; i < ItemsInfo.length; i++) {
            let Item = ItemsInfo[i];

            if (
                Item.GlobalEndDate >= Today
                && Item.Disabled != true
                && Item.Name.toLowerCase().indexOf($('#ItemNameFilter').val().toLowerCase()) > -1
                && ($('#BannerTypeFilter').val() == 0 || Item.Type == $('#BannerTypeFilter').val())
                && ($('#BannerIDFilter').val() == 0 || Item.BannerID == $('#BannerIDFilter').val())
            ) {
                if (ItemCount > 0 && ItemCount % TableColumnLimit == 0) {
                    Table += `</tr><tr>`;
                };

                Table += `
                    <td
                        type="button"
                        style="text-align: center; width: ${ItemWidth}px; height: 100px; margin-bottom: 1px;"
                        onclick="UpdateScoutPlanningTableSelection(${Item.BannerID}, ${i}, ${CurrentModalCallingRowID}); $(this).toggleClass('ModalCellActive ModalCellInactive');"
                        class="${$(`label[data-item-id="${i}"]`).length == 1 ? 'ModalCellActive' : 'ModalCellInactive'} btn btn-light"
                    >
                        ${Item.Name}
                        <br>
                        ${moment(Item.GlobalStartDate, "YYYY-MM-DD").format('L')} - ${moment(Item.GlobalEndDate, "YYYY-MM-DD").format('L')}
                    </td>
                `;
                ItemCount++;
            };
        };

        Table += `</tr></table>`

        $('#ModalSelectionResults').html(Table);
    }, 200);
};