
const TWEET_COUNT = 200;
const LIST_COUNT = 150;

var tweet_array = [];
var params = {};

var prepend_tweets = function(data, result)
{
    if (result['error']) {
        error_alert(result['error']);
        return;
    }

    $('div.tweet-content').attr('data-twtype', data.twtype);
    $('div.tweet-content').attr('data-max-id', result['max_id']);
    if (! $('div.tweet-content').attr('data-since-id')) {
        $('div.tweet-content').attr('data-since-id', result['since_id']);
    }

    tweets = result['tweets']
    for (key in tweets) {
        if (($.inArray(tweets[key]['id_org'], tweet_array) == -1)) {
            $.tmpl(tweet_tmpl, tweets[key]).prependTo(data.dest);
            tweet_array.push(tweets[key]['id_org']);
        }
    }
}

var append_tweets = function(data, result)
{
    if (result['error']) {
        error_alert(result['error']);
        return;
    }

    $('div.tweet-content').attr('data-twtype', data.twtype);
    $('div.tweet-content').attr('data-since-id', result['since_id']);
    if (! $('div.tweet-content').attr('data-max-id')) {
        $('div.tweet-content').attr('data-max-id', result['max_id']);
    }

    tweets = result['tweets']
    for (key in tweets) {
        if (($.inArray(tweets[key]['id_org'], tweet_array) == -1)) {
            $.tmpl(tweet_tmpl, tweets[key]).appendTo(data.dest);
            tweet_array.push(tweets[key]['id_org']);
        }
    }
}

var append_lists = function(data, result)
{
    for (key in result) {
        $.tmpl('<option value="${id}">${name}</option>', result[key]).appendTo(data.dest);
    }
}

$(function()
{
    //var geo = get_geo();

    $.get("_get_tweets_head", function(data) { $('.content').prepend(data); });

    write_tweets({twtype: "lists", params: {count: LIST_COUNT}, dest: '#lists'}, append_lists);
    write_tweets({twtype: "friends", params: {count: LIST_COUNT}, dest: '#following'}, append_lists);

    $.get("_get_tweet_template", function(data) {
        tweet_tmpl = data;
    }).done(function (result) {
        params = {count: TWEET_COUNT};
        write_tweets({twtype: "home_timeline", params: params, dest: 'div.tweets'}, append_tweets);
    });

    $('#timeline').on('click', function() {
        initialize_tweets();
        params = {count: TWEET_COUNT};
        write_tweets({twtype: "home_timeline", params: params, dest: 'div.tweets'}, append_tweets);
    });
    $('#favorites').on('click', function() {
        initialize_tweets();
        params = {count: TWEET_COUNT};
        write_tweets({twtype: "favorites", params: params, dest: 'div.tweets'}, append_tweets);
    });
    $('#lists').change(function() {
        initialize_tweets();
        params = {list_id: $('#lists option:selected').val(), count: TWEET_COUNT};
        write_tweets({twtype: "list_status", params: params, dest: 'div.tweets'}, append_tweets);
    });
    $('#following').change(function() {
        initialize_tweets();
        params = {user_id: $('#following option:selected').val(), count: TWEET_COUNT};
        write_tweets({twtype: "user_timeline", params: params, dest: 'div.tweets'}, append_tweets);
    });
    $('#search').submit(function(event) {
        event.preventDefault();
        initialize_tweets();
        params = {q: $('#search-text').val(), count: TWEET_COUNT};
        write_tweets({twtype: "search", params: params, dest: 'div.tweets'}, append_tweets);
    });

    $(document).on('click', 'div.tweet-newer' , function() {
        var tmp_params = $.extend(true, {}, params);
        iconate($(this).children('.fa-caret-up').get(0), {
            from: 'fa-caret-up',
            to: 'fa-caret-up',
            animation: 'fadeOutTop'
        });
        tmp_params['since_id'] = $('div.tweet-content').attr('data-max-id');
        twtype = $('div.tweet-content').attr('data-twtype');
        write_tweets({twtype: twtype, params: tmp_params, dest: 'div.tweets'}, prepend_tweets);
    });
    $(document).on('click', 'div.tweet-older' , function() {
        var tmp_params = $.extend(true, {}, params);
        iconate($(this).children('.fa-caret-down').get(0), {
            from: 'fa-caret-down',
            to: 'fa-caret-down',
            animation: 'fadeOutBottom'
        });
        tmp_params['max_id'] = $('div.tweet-content').attr('data-since-id');
        twtype = $('div.tweet-content').attr('data-twtype');
        write_tweets({twtype: twtype, params: tmp_params, dest: 'div.tweets'}, append_tweets);
    });

    $(document).on('click', 'span.retweet-count' , function() {
        var tweet_id = $(this).parents('.tweet').attr('data-id');
        if ($(this).attr('data-retweeted') == 'false') {
            var ret = request_post({twtype: 'retweet', params: {id: tweet_id}});
            if (ret) {
                iconate($(this).children('.fa-refresh').get(0), {
                    from: 'fa-refresh',
                    to: 'fa-refresh',
                    animation: 'rubberBand'
                });
                var num = Number($(this).children('.retweet-num').html());
                $(this).children('.retweet-num').html(num + 1);
                $(this).attr('data-retweeted', 'true');
                $(this).css('color', '#00cc00');
            }
        } else if ($(this).attr('data-retweeted') == 'true') {
            var ret = request_post({twtype: 'unretweet', params: {id: tweet_id}});
            if (ret) {
                var num = Number($(this).children('.retweet-num').html());
                $(this).children('i.retweet-num').html(num - 1);
                $(this).attr('data-retweeted', 'false');
                $(this).css('color', '#666666');
            }
        }
    });
    $(document).on('click', 'span.favorite-count' , function() {
        var tweet_id = $(this).parents('.tweet').attr('data-id');
        if ($(this).attr('data-favorited') == 'false') {
            var ret = request_post({twtype: 'favorite-create', params: {id: tweet_id}});
            if (ret) {
                iconate($(this).children('.fa-heart').get(0), {
                    from: 'fa-heart',
                    to: 'fa-heart',
                    animation: 'rubberBand'
                });
                var num = Number($(this).children('.favorite-num').html());
                $(this).children('i.favorite-num').html(num + 1);
                $(this).attr('data-favorited', 'true');
                $(this).css('color', '#ff0000');
            }
        } else if ($(this).attr('data-favorited') == 'true')  {
            var ret = request_post({twtype: 'favorite-destroy', params: {id: tweet_id}});
            if (ret) {
                var num = Number($(this).children('.favorite-num').html());
                $(this).children('i.favorite-num').html(num - 1);
                $(this).attr('data-favorited', 'false');
                $(this).css('color', '#666666');
            }
        }
    });

    $(document).on('mouseover',"span.retweet-count", function() {
        if ($(this).attr("data-retweeted") == "false")  {
            $(this).css('color', "#00cc00");
        }
    });
    $(document).on('mouseout',"span.retweet-count", function() {
        if ($(this).attr("data-retweeted") == "false")  {
            $(this).css('color', "#666666");
        }
    });
    $(document).on('mouseover',"span.favorite-count", function() {
        if ($(this).attr("data-favorited") == "false")  {
            $(this).css('color', "#ff0000");
        }
    });
    $(document).on('mouseout',"span.favorite-count" ,function() {
        if ($(this).attr("data-favorited") == "false")  {
            $(this).css('color', "#666666");
        }
    });
    $(document).on('mouseover',"div.tweet-newer", function() {
        $(this).css('background-color', "#f0f0f0");
    });
    $(document).on('mouseout',"div.tweet-newer" ,function() {
        $(this).css('background-color', "#ffffff");
    });
    $(document).on('mouseover',"div.tweet-older", function() {
        $(this).css('background-color', "#f0f0f0");
    });
    $(document).on('mouseout',"div.tweet-older" ,function() {
        $(this).css('background-color', "#ffffff");
    });
});

function initialize_tweets()
{
    $('div.tweet').remove();
    tweet_array = [];
    $('div.tweet-content').removeAttr('data-since-id data-max-id');
}

function loading_image(status)
{
    var height = $('div.tweet-content').height();
    $('div.fade').css("height", height);

    if (status == true) {
        $('div.loader').fadeIn(200);
        $('div.fade').fadeIn(200);
    } else {
        $('div.fade').delay(300).fadeOut(200);
        $('div.loader').delay(300).fadeOut(200);
    }
}

function disable_button(status)
{
    $('#timeline').prop('disabled', status);
    $('#favorites').prop('disabled', status);
    $('#lists').prop('disabled', status);
    $('#following').prop('disabled', status);
    $('#search').prop('disabled', status);
    if (status == true) {
        $('div.tweet-newer').css('pointer-events', "none");
        $('div.tweet-older').css('pointer-events', "none");
    } else {
        $('div.tweet-newer').css('pointer-events', "auto");
        $('div.tweet-older').css('pointer-events', "auto");
    }
    loading_image(status);
}

function get_geo()
{
    $.get("_get_ipaddr", function (data) {
        get_tweets_js({twtype: "geosearch", params: {ip: data}}).done(function (result) {
            console.log(result);
            return result;
        }).fail(function(result) {
            error_confirm(result);
        });
    });
}

function write_oath2_tweets(data, func)
{
    disable_button(true);
    get_oath2_tweets_js(data).done(function (result) {
        func(data, result);
        disable_button(false);
    }).fail(function(result) {
        error_confirm(result);
        disable_button(false);
    });
}

function write_tweets(data, func)
{
    disable_button(true);
    get_tweets_js(data).done(function (result) {
        func(data, result);
        disable_button(false);
    }).fail(function(result) {
        error_confirm(result);
        disable_button(false);
    });
}

function get_oath2_tweets_js(data)
{
    return $.ajax({
        url: '_get_oath2_tweets_js',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
    });
}

function get_tweets_js(data)
{
    return $.ajax({
        url: '_get_tweets_js',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
    });
}

function get_tweets(data)
{
    return $.ajax({
        url: '_get_tweets',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'html',
    });
}

function request_post(data)
{
    return post_tweets(data).done(function(result) {
        if (result == "success") {
            return true;
        } else {
            error_alert(result);
            return false;
        }
    }).fail(function(result) {
        error_confirm(result);
    });
}

function post_tweets(data)
{
    return $.ajax({
        url: '_post_tweets',
        type: 'post',
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'text',
    });
}

function error_alert(result)
{
    console.log(result);
    alert(result);
}

function error_confirm(result)
{
    console.log(result);
    if (!confirm("エラーが発生しました。ログアウトします\n" + result)){
        return;
    } else {
        location.href = "/logout";
    }
}
