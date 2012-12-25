$(function() {
    var textarea        = $('#controller textarea'),
        doc_width       = document.width,
        doc_height      = Math.round(doc_width / 1.55),
        max_text_width  = doc_width * 0.75,
        max_text_height = doc_height * 0.75,
        step            = 2, // stepsize in font points for auto-adjustment on writing
        tolerance       = 5, // percentage of max limit that text area should be wihin
        canvas,
        canvas_text,
        timeout,
        print_window;

    /**
     * sets up the canvas object
     *
     * @return void
     */
    function setupCanvas()
    {
        canvas = new fabric.StaticCanvas('container');
        canvas.setHeight(doc_height)
            .setWidth(doc_width)
            .setBackgroundImage('/backgrounds/' + backgrounds[0]);

        canvas_text = new fabric.Text(textarea.val(), {
            fontSize: 100,
            textAlign: 'center',
            left: doc_width / 2,
            top: doc_height / 2
        });

        if (fonts && fonts[0]) {
            canvas_text.fontFamily = fonts[0];
        }

        canvas.add(canvas_text);
        window.setTimeout(function() {
            canvas.renderAll()
        }, 1000);
    }

    /**
     * creates and initializes a background selector
     *
     * @return void
     */
    function setupBackgroundSelector()
    {
        var select = $('<select></select>');

        for (var i = 0, length = backgrounds.length; i < length; ++i) {
            select.append('<option value="/backgrounds/' + backgrounds[i] + '">' + backgrounds[i] + '</option>');
        }

        $('#advanced p.background').append(select);

        select.on('change', function() {
            canvas.setBackgroundImage(select.val());
            canvas.renderAll();
            window.setTimeout(function() {
                canvas.renderAll();
            }, 1000);
        });
    }

    /**
     * creates and initializes a font selector
     *
     * @return void
     */
    function setupFontSelector()
    {
        var select = $('<select></select>');

        for (var i = 0, length = fonts.length; i < length; ++i) {
            select.append('<option value="' + fonts[i] + '">' + fonts[i] + '</option>');
        }

        $('#advanced p.font').append(select);

        select.on('change', function() {
            canvas_text.fontFamily = select.val();
            canvas.renderAll();
            window.setTimeout(function() {
                canvas.renderAll();
            }, 1000);
        });
    }

    /**
     * runs when user clicks in the control panel
     *
     * @param Event e Click event triggered
     *
     * @return void
     */
    function handleControllerClick(e)
    {
        var self      = $(e.target),
            classname;

        $('#background-color-picker, #text-color-picker').hide();

        if (e.target.nodeName == 'INPUT') {
            classname = self.attr('id') + '-picker';
            $('#' + classname).show();
        }
    }

    /**
     * runs when the user types text into the textarea
     *
     * @param Event e Key event triggered
     *
     * @return void
     */
    function handleTextChange(e)
    {
        var self = $(this);

        if (timeout) {
            window.clearTimeout(timeout);
        }

        function doTextChange()
        {
            var font_size = $('#font-size'),
                modifier,
                limit = 50;

            timeout = null;

            canvas_text.setText(self.val());

            if (!isTextWithinTolerance()) {
                modifier = step * (canvas_text.getWidth() > max_text_width || canvas_text.getHeight() > max_text_height ? -1 : 1);

                while (!isTextWithinTolerance() && limit) {
                    font_size.val(parseInt(font_size.val(), 10) + modifier);
                    handleFontSizeChange.call(font_size);
                    limit--;
                }
            }

            canvas.renderAll();
        }

        timeout = window.setTimeout(doTextChange, 300);
    }

    /**
     * checks if the text painted is currently within the tolerance zone
     *
     * @return bool
     */
    function isTextWithinTolerance()
    {
        var text_width  = canvas_text.getWidth(),
            text_height = canvas_text.getHeight();

        return (text_width < max_text_width && text_height < max_text_height)
            && (Math.abs(text_width - max_text_width) < max_text_width * tolerance / 100
                || Math.abs(text_height - max_text_height) < max_text_height * tolerance / 100);
    }

    /**
     * runs after user has chosen new color for text
     *
     * @param string color New color chosen
     *
     * @return void
     */
    function handleTextColorChange(color)
    {
        $('#text-color').css('background-color', color).val(color);
        canvas_text.setColor(color);
        canvas.renderAll();
    }

    /**
     * runs after user has chosen new color for the background
     *
     * @param string color New color chosen
     *
     * @return void
     */
    function handleBackgroundColorChange(color)
    {
        $('#background-color').css('background-color', color).val(color);
        container.css('background-color', color);
    }

    /**
     * runs when the user clicks on one of
     * the text alignment radio buttons
     *
     * @param Event e Click event triggered
     *
     * @return void
     */
    function handleAlignmentClick(e)
    {
        canvas_text.textAlign = $(this).val();
        canvas.renderAll();
    }

    /**
     * runs when the user changes the font size
     *
     * @param Event e Change event triggered
     *
     * @return void
     */
    function handleFontSizeChange(e)
    {
        canvas_text.setFontsize(parseInt($(this).val(), 10));
        canvas.renderAll();
    }

    /**
     * opens/closes the advanced settings
     *
     * @param Event e Click event triggered
     *
     * @return void
     */
    function toggleAdvancedSettings(e)
    {
        $('#advanced').animate({height: 'toggle'});
    }

    /**
     * handles exporting the canvas to an image
     *
     * @param Event e Click event triggered
     *
     * @return void
     */
    function handlePrint(e)
    {
        var window_loading = false;
        function addElement(print_window)
        {
            $(print_window.document).find('body').html('<img alt="" src="' + canvas.toDataURL('png', 1) + '"/>');
        }

        if (!print_window || print_window.closed) {
            print_window = null;
            print_window = window.open('/print.html', 'printing');

            window_loading = true;
        }

        if (window_loading) {
            print_window.onload = function() {
                addElement(print_window);
            };
        } else {
            addElement(print_window);
        }
    }

    /**
     * triggers when a user changes the color of the
     * text via the input field and not the color picker
     *
     * @param Event e Change event triggered
     *
     * @return void
     */
    function handleManualTextColorChange(e)
    {
        $.farbtastic('#text-color-picker').setColor($(this).val());
        handleTextColorChange($(this).val());
    }

    /**
     * triggers when a user changes the color of the
     * background via the input field and not the color picker
     *
     * @param Event e Change event triggered
     *
     * @return void
     */
    function handleManualBackgroundColorChange()
    {
        handleBackgroundColorChange($(this).val());
    }

    // setup color pickers
    $('#background-color-picker').farbtastic(handleBackgroundColorChange);
    $('#text-color-picker').farbtastic(handleTextColorChange);

    // setup event listeners
    $('#controller').on('click', handleControllerClick)
        .on('click', 'input.alignment', handleAlignmentClick)
        .on('keyup', 'textarea', handleTextChange);

    $('#font-size').on('change', handleFontSizeChange);

    $('#controller button.opener').click(toggleAdvancedSettings);

    $('#print').click(handlePrint);

    $('#text-color').change(handleManualTextColorChange);
    $('#background-color').change(handleManualBackgroundColorChange);

    setupCanvas();
    setupFontSelector();
    setupBackgroundSelector();
});
