/* global jQuery */
/* global wpDiscuzTenorObj */
/* global wpdiscuzAjaxObj */
/* global wpDiscuzEditor */
/* global Quill */
jQuery(document).ready(function ($) {
//    var url = 'https://g.tenor.com/v1/';
    var url = 'https://tenor.googleapis.com/v2/';
    var limit = parseInt(wpDiscuzTenorObj.limit);
    var categories = [];
    var next = 0;
    var doingajax = false;
    var activeEditorId = '';
    var selection = null;
    var xhr = null;
    var isSearch = false;
    var wpdiscuzLoadRichEditor = parseInt(wpdiscuzAjaxObj.loadRichEditor);

    if (parseInt(wpDiscuzTenorObj.isAllowed)) {
        if (wpdiscuzLoadRichEditor) {
            wpDiscuzEditor.addButtonEventHandler('tenor', function (editor) {
                activeEditorId = '#' + editor.container.id;
                selection = editor.getSelection();
                $('#wpdiscuz-tenor-popup-bg').show();
                $('#wpdiscuz-tenor-popup').css('display', 'flex');
                getGIFCategories();
            });
        } else {
            $(document).on('click', '.wpdiscuz-tenor-icon', function () {
                $('.wpd-form-foot', $(this).parents('.wpd_comm_form')).slideDown(parseInt(wpdiscuzAjaxObj.enableDropAnimation) ? 500 : 0);
                if ($(this).parents('.wpd_comm_form').length) {
                    activeEditorId = '#wc-textarea-' + $(this).parents('.wpd_comm_form').find('[name=wpdiscuz_unique_id]').val();
                } else if ($(this).parents('#wpdiscuz-edit-form').length) {
                    activeEditorId = '#wc-textarea-edit_' + $(this).parents('#wpdiscuz-edit-form').find('[name=wpdiscuz_unique_id]').val();
                }
                $('#wpdiscuz-tenor-popup-bg').show();
                $('#wpdiscuz-tenor-popup').css('display', 'flex');
                getGIFCategories();
            });
        }

        $(document).on('click', '.wpdiscuz-tenor-category', function () {
            var category = encodeURIComponent($(this).attr('data-searchterm'));
            $('#wpdiscuz-tenor-content').attr('data-searchterm', category).empty();
            $('#wpdiscuz-tenor-links').show();
            if (category === 'featured') {
                searchTrendingGIFs(true);
            } else {
                searchGIFsByCategory(category, true);
            }
        });

        $(document).on('click', '.wpdiscuz-tenor-gif', function () {
            var shortcode = "[wpd-tenor full='" + $(this).attr('data-full') + "' preview='" + $(this).attr('data-preview') + "' width='" + $(this).attr('data-width') + "' height='" + $(this).attr('data-height') + "']";
            if (isSearch) {
                registerShare($('#wpdiscuz-tenor-content').attr('data-searchterm'), $(this).attr('data-id'));
            }
            if (wpdiscuzLoadRichEditor) {
                var editor = wpDiscuzEditor.createEditor(activeEditorId);
                if (!selection) {
                    selection = {index: editor.getLength() - 1, length: 0};
                }
                editor.insertText(selection.index, shortcode, Quill.sources.USER);
                editor.setSelection(selection.index + selection.length + shortcode.length, Quill.sources.USER);
                selection = null;
            } else {
                var textarea = $(activeEditorId);
                var textareaVal = textarea.val();
                var selectionStart = textareaVal.length;
                if (textarea.prop("selectionStart")) {
                    selectionStart = textarea.prop("selectionStart");
                }
                textarea.val(textareaVal.slice(0, selectionStart) + shortcode + textareaVal.slice(selectionStart));
            }
            closePopup();
        });

        $(document).on('keyup', '#wpdiscuz-tenor-search', function () {
            isSearch = true;
            var el = $(this);
            var val = el.val();
            if (val.length > 2) {
                $('#wpdiscuz-tenor-content').attr('data-searchterm', val).empty();
                $('#wpdiscuz-tenor-links').show();
                searchGIFs(val, true);
            } else if (val.length === 0) {
                $('#wpdiscuz-tenor-content').removeAttr('data-searchterm').empty();
                getGIFCategories();
            }
        });

        $('#wpdiscuz-tenor-content').on('scroll', function () {
            var searchterm = $(this).attr('data-searchterm');
            if (next && searchterm && (this.scrollHeight - this.scrollTop - this.clientHeight < 200)) {
                if (searchterm === 'trending') {
                    searchTrendingGIFs(false);
                } else {
                    searchGIFsByCategory(searchterm, false);
                }
            }
        });

        $(document).on('click', '#wpdiscuz-tenor-back-to-categories', function (e) {
            e.preventDefault();
            isSearch = false;
            $('#wpdiscuz-tenor-search').val('');
            $('#wpdiscuz-tenor-content').removeAttr('data-searchterm').empty();
            getGIFCategories();
        });

        $(document).on('click', '#wpdiscuz-tenor-popup-bg', function () {
            closePopup();
        });

    }

    function getGIFCategories() {
        next = 0;
        if (categories.length) {
            $('#wpdiscuz-tenor-links').hide();
            printCategories(categories);
        } else {
            $('#wpdiscuz-loading-bar').show();
            $.ajax({
                type: 'GET',
                url: url + 'categories?key=' + wpDiscuzTenorObj.key + '&locale=' + wpDiscuzTenorObj.locale + '&contentfilter=' + wpDiscuzTenorObj.contentfilter
            }).done(function (r) {
                if (r.tags) {
                    categories = r.tags;
                    printCategories(categories);
                } else if (r.error) {
                    wpdiscuzAjaxObj.setCommentMessage(r.error, 'error');
                }
                $('#wpdiscuz-tenor-links').hide();
                $('#wpdiscuz-loading-bar').fadeOut(250);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                $('#wpdiscuz-tenor-links').hide();
                $('#wpdiscuz-loading-bar').fadeOut(250);
                console.log(errorThrown);
            });
        }
    }

    function searchGIFsByCategory(category, clearWrapper) {
        if (!doingajax) {
            doingajax = true;
            var pos = next ? ('&pos=' + next) : '';
            $('#wpdiscuz-loading-bar').show();
            $.ajax({
                type: 'GET',
                url: url + 'search?key=' + wpDiscuzTenorObj.key + '&q=' + encodeURIComponent(category) + '&locale=' + wpDiscuzTenorObj.locale + '&contentfilter=' + wpDiscuzTenorObj.contentfilter + '&media_filter=minimal' + '&limit=' + limit + pos
            }).done(function (r) {
                if (r.results) {
                    if (clearWrapper) {
                        $('#wpdiscuz-tenor-content').empty().append(
                            $('<div>').addClass('wpdiscuz-tenor-content-left'),
                            $('<div>').addClass('wpdiscuz-tenor-content-right')
                        );
                    }
                    printGIFs(r.results);
                    next = r.next;
                    doingajax = false;
                } else if (r.error) {
                    wpdiscuzAjaxObj.setCommentMessage(r.error, 'error');
                }
                $('#wpdiscuz-loading-bar').fadeOut(250);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                doingajax = false;
                $('#wpdiscuz-loading-bar').fadeOut(250);
                console.log(errorThrown);
            });
        }
    }

    function searchTrendingGIFs(clearWrapper) {
        if (!doingajax) {
            doingajax = true;
            var pos = next ? ('&pos=' + next) : '';
            $('#wpdiscuz-loading-bar').show();
            $.ajax({
                type: 'GET',
                url: url + 'featured?key=' + wpDiscuzTenorObj.key + '&locale=' + wpDiscuzTenorObj.locale + '&contentfilter=' + wpDiscuzTenorObj.contentfilter + '&media_filter=minimal' + '&limit=' + limit + pos
            }).done(function (r) {
                if (r.results) {
                    if (clearWrapper) {
                        $('#wpdiscuz-tenor-content').empty().append(
                            $('<div>').addClass('wpdiscuz-tenor-content-left'),
                            $('<div>').addClass('wpdiscuz-tenor-content-right')
                        );
                    }
                    printGIFs(r.results);
                    next = r.next;
                    doingajax = false;
                } else if (r.error) {
                    wpdiscuzAjaxObj.setCommentMessage(r.error, 'error');
                }
                $('#wpdiscuz-loading-bar').fadeOut(250);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                doingajax = false;
                $('#wpdiscuz-loading-bar').fadeOut(250);
                console.log(errorThrown);
            });
        }
    }

    function searchGIFs(search) {
        $('#wpdiscuz-loading-bar').show();
        if (xhr) {
            xhr.abort();
        }
        xhr = $.ajax({
            type: 'GET',
            url: url + 'search?key=' + wpDiscuzTenorObj.key + '&q=' + encodeURIComponent(search) + '&locale=' + wpDiscuzTenorObj.locale + '&contentfilter=' + wpDiscuzTenorObj.contentfilter + '&media_filter=minimal' + '&limit=' + limit
        }).done(function (r) {
            if (r.results) {
                $('#wpdiscuz-tenor-content').empty().append(
                    $('<div>').addClass('wpdiscuz-tenor-content-left'),
                    $('<div>').addClass('wpdiscuz-tenor-content-right')
                );
                printGIFs(r.results);
                next = r.next;
            } else if (r.error) {
                wpdiscuzAjaxObj.setCommentMessage(r.error, 'error');
            }
            $('#wpdiscuz-loading-bar').fadeOut(250);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            $('#wpdiscuz-loading-bar').fadeOut(250);
            console.log(errorThrown);
        });
    }

    function registerShare(searchterm, id) {
        $.ajax({
            type: 'GET',
            url: url + 'registershare?key=' + wpDiscuzTenorObj.key + '&q=' + encodeURIComponent(searchterm) + '&locale=' + wpDiscuzTenorObj.locale + '&id=' + id
        });
    }

    function printCategories(tags) {
        $('#wpdiscuz-tenor-content').append(
            $('<div>')
                .addClass('wpdiscuz-tenor-category wpdiscuz-tenor-trending')
                .attr('data-searchterm', 'featured')
                .prop('title', wpDiscuzTenorObj.phraseTrending)
                .css('background-color', '#91b58c')
                .append(
                    $('<div>')
                        .addClass('wpdiscuz-tenor-category-smooth')
                        .html('<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chart-line" class="svg-inline--fa fa-chart-line fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16"><path fill="currentColor" d="M496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM464 96H345.94c-21.38 0-32.09 25.85-16.97 40.97l32.4 32.4L288 242.75l-73.37-73.37c-12.5-12.5-32.76-12.5-45.25 0l-68.69 68.69c-6.25 6.25-6.25 16.38 0 22.63l22.62 22.62c6.25 6.25 16.38 6.25 22.63 0L192 237.25l73.37 73.37c12.5 12.5 32.76 12.5 45.25 0l96-96 32.4 32.4c15.12 15.12 40.97 4.41 40.97-16.97V112c.01-8.84-7.15-16-15.99-16z"></path></svg>&nbsp;' + wpDiscuzTenorObj.phraseTrending)
                )
        );
        tags.forEach(function (val) {
            $('#wpdiscuz-tenor-content').append(
                $('<div>')
                    .addClass('wpdiscuz-tenor-category')
                    .attr('data-searchterm', val.searchterm)
                    .prop('title', val.searchterm)
                    .css('background-image', 'url(' + val.image + ')')
                    .append(
                        $('<div>')
                            .addClass('wpdiscuz-tenor-category-smooth')
                            .html(val.searchterm)
                    )
            );
        });
    }

    function printGIFs(results) {
        var half = Math.round(results.length / 2);
        results.forEach(function (val, i) {
            $('.wpdiscuz-tenor-content-' + (i < half ? 'left' : 'right')).append(
                $('<img>')
                    .attr('src', val.media_formats.gif.url)
                    .attr('data-id', val.id)
                    .attr('data-full', val.media_formats.tinygif.url.replace('https://media.tenor.com/', ''))
					.attr('data-preview', val.media_formats.gifpreview.url.replace('https://media.tenor.com/', ''))
                    .attr('data-width', val.media_formats.gif.dims[0])
                    .attr('data-height', val.media_formats.gif.dims[1])
                    .addClass('wpdiscuz-tenor-gif')
                    .prop('title', val.title)
            );
        });
    }

    function closePopup() {
        $('#wpdiscuz-tenor-popup-bg').hide();
        $('#wpdiscuz-tenor-popup').hide();
        $('#wpdiscuz-tenor-links').hide();
        $('#wpdiscuz-tenor-content').removeAttr('data-searchterm').empty();
        $('#wpdiscuz-tenor-search').val('');
        activeEditorId = '';
        selection = null;
        isSearch = false;
    }

    $(document).on('click', '.wpdiscuz-tenor-preview-gif', function () {
        var el = $(this);
        var tenorURL = 'https://media.tenor.com/';
        if(/\/tenor\.gif$/.test(el.attr('data-full'))){
            tenorURL = 'https://media.tenor.com/images/';
        }else if(/^https\:\/\//.test(el.attr('data-full'))){
			tenorURL = ''
		}
        el.find('.wpdiscuz-tenor-embedded-gif').prop('src', tenorURL + el.attr('data-full'));
        el.removeClass('wpdiscuz-tenor-preview-gif').addClass('wpdiscuz-tenor-full-gif');
    });

    $(document).on('click', '.wpdiscuz-tenor-full-gif', function () {
        var el = $(this);
        var tenorURL = 'https://media.tenor.com/';
        if(/\/tenor\.png$/.test(el.attr('data-preview'))){
            tenorURL = 'https://media.tenor.com/images/';
        }else if(/^https\:\/\//.test(el.attr('data-full'))){
			tenorURL = ''
		}
        el.find('.wpdiscuz-tenor-embedded-gif').prop('src', tenorURL + el.attr('data-preview'));
        el.removeClass('wpdiscuz-tenor-full-gif').addClass('wpdiscuz-tenor-preview-gif');
    });
});