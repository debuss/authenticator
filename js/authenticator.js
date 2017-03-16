/**
 * @author Alexandre Debusschere
 */

const config = require('electron-json-config');
const speakeasy = require('speakeasy');
const base64 = require('base-64');
const utf8 = require('utf8');
const shell = require('electron').shell;

function addNewSecret() {
    var secret_form = $('#form');
    var name = secret_form.find('.name').val();
    var secret = secret_form.find('.secret').val();
    var model = $('#block-model').clone().removeAttr('id');

    if (!name || !secret) {
        alert('You did not specify a ' + (!name ? 'name' : 'secret') + '.');
        return false;
    }

    config.set(base64Encode(name), secret);

    model.find('.name').text(name);
    model.find('.secret').val(secret);
    model.find('.token').val('******');
    model.appendTo('#container').show();

    secret_form.find('.name, .secret').val('');
}

function base64Encode(str) {
    return base64.encode(utf8.encode(str));
}

function base64Decode(str) {
    return utf8.decode(base64.decode(str));
}

function inArray(value, array) {
    for (var i in array) {
        if (array.hasOwnProperty(i) && (array[i] + '') === (value + '')) {
            return true;
        }
    }

    return false;
}

$(document).ready(function() {
    setInterval(function() {
        $('#container').find('.secret').each(function() {
            var parent = $(this).parent();
            var progress = new Date().getSeconds();

            progress = (progress > 29) ? (30 - (60 - progress)) : progress;

            parent.find('progress').val(progress);

            if (progress == 0 || inArray(parent.find('.token').text(), ['TOKEN', '******'])) {
                var token = speakeasy.totp({
                    secret: $(this).val(),
                    encoding: 'base32'
                });

                parent.find('.token').text(token);
            }
        });
    }, 1000);

    var secrets = config.all();
    for (var key in secrets) {
        if (!secrets.hasOwnProperty(key)) {
            continue;
        }

        var model = $('#block-model').clone().removeAttr('id');
        model.find('.name').text(base64Decode(key));
        model.find('.secret').val(secrets[key]);
        model.find('.token').text('******');
        model.appendTo('#container').show();
    }

    $('#show-informations').click(function() {
        $('#main, #informations').toggle();
    });

    function resetSecretConf()
    {
        config.purge();
        $('#container').find('.block').not('#form').each(function () {
            var name = $(this).find('.name').text();
            var secret = $(this).find('.secret').val();

            config.set(base64Encode(name), secret);
        });
    }

    $('#container')
        .on('click', '.options .delete', function() {
            var block = $(this).closest('.block');
            var name = block.find('.name').text();

            config.delete(base64Encode(name));
            block.remove();
        })
        .on('click', '.options .up', function() {
            var block = $(this).closest('.block');
            var previous = block.prev().not('#form');

            if (previous.length == 0) {
                return true;
            }

            block.insertBefore(previous);
            resetSecretConf();
        })
        .on('click', '.options .down', function() {
            var block = $(this).closest('.block');
            var next = block.next().not('#form');

            if (next.length == 0) {
                return true;
            }

            block.insertAfter(next);
            resetSecretConf();
        });
});