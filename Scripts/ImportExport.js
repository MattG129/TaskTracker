function Export() {
    let ExportState = JSON.stringify(CompileForm());
    var temp = $("<input>");
    $("body").append(temp);
    temp.val(ExportState).select();
    document.execCommand("copy");
    temp.remove();

    swal({icon: 'success', text: 'Export copied to clipboard.', timer: 2000});
};

function Import(RunCalcs, ImportState, Scroll) {
    ImportInProgress = true;
    let ValidImport = true;
    let JSONImport;

    try {
        JSONImport = JSON.parse(ImportState);

        // Since some of the import code explicitly references the scout plan array it needs to be defined.
        if (JSONImport.TasksPlanArray == undefined) {
            ValidImport = false;
        };
    } catch (error) {
        ValidImport = false;
    };

    if (!ValidImport) {
        $('#InvalidImportMessage').show();
        ImportInProgress = false;
    }
    else if (RunCalcs && JSONImport.ValidationErrors > 0) {
        swal({icon: 'error', text: 'Validation issues were detected in the import. The import will proceed, but calculations will not be performed.'}).then(function() {
            Import(RunCalcs=false, ImportState=ImportState, Scroll=true);
        });
    }
    else {
        $('#InvalidImportMessage').hide();
        $('#LoadingImportMessage').show();
        $('#TasksPlanningLoadingMessage').show();

        $('tr.BonusTableRow').remove();

        setTimeout(function() {
            $('#form input:not(.TasksPlanField), #form select:not(.TasksPlanField)').each(function() {
                if ($(this).is(':checkbox')) {
                    $(this).prop('checked', JSONImport[this.id]);
                }
                else {
                    // The renewal date field used to use a different date format so this will account for that when loading older imports.
                    if ($(this).hasClass('form-date') && !moment(JSONImport[this.id], "MM/DD/YYYY").isValid() && moment(JSONImport[this.id]).isValid()) {
                        JSONImport[this.id] = moment(JSONImport[this.id]).format('L');
                    };

                    $(this).val(JSONImport[this.id]);
                };
            });

            // We will remove the existing scout planning rows to avoid any potential conflicts with the imported ones.
            $('tr[data-tasks-plan-rowid]').remove();
            NewTasksPlanRowID = 0; // We will set this to zero so that each row's id will line up with the scout plan item's index.

            for (let i = 0; i < JSONImport.TasksPlanArray.length; i++) {
                let TasksPlanRow = JSONImport.TasksPlanArray[i];

                AddTasksPlanRow(TasksPlanRow.TableType);

                // TODO: Really need to write some of this dynamically.
                $(`tr[data-tasks-plan-rowid=${i}] td .TasksPlanItem`).val(TasksPlanRow.Item);
                $(`tr[data-tasks-plan-rowid=${i}] td .TasksPlanDueDate`).val(TasksPlanRow.DueDate);
                $(`tr[data-tasks-plan-rowid=${i}] td .TasksPlanDueTime`).val(TasksPlanRow.DueTime);
                $(`tr[data-tasks-plan-rowid=${i}] td .TasksPlanNotes`).val(TasksPlanRow.Notes);
                $(`tr[data-tasks-plan-rowid=${i}] td .TasksPlanCompleted`).prop('checked', TasksPlanRow.Completed);
            };

            if (JSONImport.TasksPlanArray.length == 0) {
                $('#TasksPlanningLoadingMessage').hide();
            };

            SetParsleyValidations(Validate=true);

            if (RunCalcs == true) {
                $('#Calculate').trigger('click');
            }
            else if (Scroll == true) {
                /* We will prevent ValidateTasksPlanningTable from running till the scroll is complete.
                As otherwise it would delay the scrolling animation. */
                // TODO: The above comment will need to be revisted as this was made prior to the select2 dropdowns being replaced with modal selection.
                clearTimeout(UpdateTableTimeout);

                $('html, body').animate({
                    scrollTop: $("#CalculatorHeaderAnchor").offset().top,
                    easing: 'linear'
                }, 500, function() {ValidateTasksPlanningTable()});
            };

            $('#LoadingImportMessage').hide();
            ImportInProgress = false;
        }, 100);
    };
};