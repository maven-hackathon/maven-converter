/*
 * app.js
 *
 * JavaScript app for maven-converter: converts Google spreadsheet
 * data to Parse.com table.
 */

function do_convert() {

    var gsheet = $('#gsheet_url').val();
    var parse_key = $('#parse_key').val();
    var parse_secret = $('#parse_secret').val();

    if (gsheet && parse_key && parse_secret) {
        // init Parse before Tabletop because the latter function
        // needs to push data to Parse
        Parse.initialize(parse_key, parse_secret);
        Tabletop.init( { key: gsheet,
                         callback: handle_gsheet,
                         simpleSheet: true
                       });
    } else {
        alert('Need GSheet and/or Parse credentials');
    }
}

function get_streetAddress(row) {
    var addr = row['Address'];

    return addr;
}

function get_content(row) {
    var content = row['Paragraph of Summary'];

    return content;
}

function get_latlon(row) {
    var lat = row['lat'];
    var lon = row['lng'];

    return {latitude: lat, longitude: lon};
}

function get_name(row) {
    var raw = row['Event/Person/location'];
    var cleansed = raw.replace(/^\s+/, '').replace(/\s+$/, '')

    return cleansed;
}

function get_summary(row) {
    var summ = row['Short Summary'];

    return summ;
}

function handle_gsheet(data, tabletop) {
    // Map-Location
    var MapLocation = Parse.Object.extend('MapLocation');

    console.log(data);

    // cycle through GSheet & push to Parse
    $.each(data, function(ii, row) {
        var name = get_name(row);
        var address = get_streetAddress(row);
        var latlon = get_latlon(row);
        var summary = get_summary(row);
        var content = get_content(row);

        // compare names & either push or update Parse
        var query = new Parse.Query(MapLocation);
        query.equalTo('name', name);
        query.find({
            success: function(results) {
                // if found, grab only the first result which may be a
                // logic bug (but name should be unique)
                var loc = (0 == results.length)
                    ? new MapLocation()
                    : results[0];

                parse_add(loc, name, address, latlon, summary, content);
            }
        })
    });
}

function parse_add(obj, name, address, latlon, summary, content) {
    obj.set('name', name);
    obj.set('summary', summary);
    obj.set('content', content);

    obj.set('phoneNumber', '(415) 703-6150');

    set_geo_point(obj, latlon);
    set_streetAddress(obj, address);
    set_tags(obj);

    obj.save(null, {
        success: function(newLoc) {
            // Execute that should take place after the object is saved.
            console.log('Parse object saved:', newLoc);
        },
        error: function(newLoc, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            alert('Failed to create new object, with error code: '
                  + error.message);
        }
    });
}

// Set lat/lon only if they are valid
function set_geo_point(obj, latlon) {
    if (latlon.latitude && latlon.longitude) {
        var lat = Number.parseFloat(latlon.latitude),
            lon = Number.parseFloat(latlon.longitude);

        obj.set('latlon', new Parse.GeoPoint(lat, lon));
    }
}

// set street address if valid
function set_streetAddress(obj, addr) {
    if (addr) {
        obj.set('streetAddress', addr);
    }
}

function set_tags(obj) {
    var attribs = ['tour'];

    obj.set('tags', attribs);
}    

$(document).ready(function() {

    // do the right thing when the "Convert!" button is clicked
    $("#btn_convert").click(do_convert);

});
