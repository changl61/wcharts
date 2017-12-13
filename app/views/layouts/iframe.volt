<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    {{ get_title() }}
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Wonderful charts based on elasticsearch.">
    <meta name="author" content="Feifan devops <changlei5@wanda.cn>">
    {{ stylesheet_link('assets/css/bootstrap.min.css') }}
    {{ stylesheet_link('assets/fonts/iconfont.css') }}
    {{ stylesheet_link('assets/css/common.css') }}
    {{ stylesheet_link('assets/css/iframe/' ~ controller ~ '.css') }}
</head>
<body>
    {{ content() }}

    {{ javascript_include('assets/js/jquery.min.js') }}
    {{ javascript_include('assets/js/bootstrap.min.js') }}
    {{ javascript_include('assets/js/underscore.min.js') }}
    {{ javascript_include('assets/js/anime.min.js') }}
    {{ javascript_include('assets/js/moment.min.js') }}
    {{ javascript_include('assets/js/common.js') }}
    {{ javascript_include('assets/js/iframe/' ~ controller ~ '.js') }}
</body>
</html>