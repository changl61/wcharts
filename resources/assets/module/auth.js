// ============================
// 授权认证 - 登录
// ============================
$(function () {
    if ($('body').data('location') != 'auth/login') return;

    $('#form-login').validator({
        rules:{
            name: 'required|userName',
            password: 'required',
        }
    }).submit(function () {
        // 是否验证通过
        var validator = $(this).data('instance.validator');
        if (!validator.isValid()) return false;

        // 异步提交
        var $submit = $('button[type="submit"]', $(this));
        $submit.loading('start');
        $.http.post('/auth/login', $.getValByNames(['name', 'password']), {
            progress: true,
            success: function (data, status, msg) {
                if (data.hasTeamAccounts) {
                    return showSelectAccount();
                }

                else if (!data.hasEsCluster) {
                    $.message.tip('登录成功', function () {
                        window.location.href = '/auth/es';
                    });
                }

                else {
                    $.message.tip('登录成功', function () {
                        window.location.href = '/setting/es';
                    });
                }
            },
            error: function (data, status, msg) {
                $.message.warn(msg);
            },
            complete: function () {
                $submit.loading('done');
            },
        });
        return false;
    });

    var showSelectAccount = function () {
        $('#form-login').addClass('animation-fadeOutLeft');
        $('.description span').text('登录成功, 请选择进入的帐号');

        $.http.get('/team/accounts', {}, {
            success: function (data) {
                var teamAccounts = '';
                for (var i = 0; i < data.team.length; i++) {
                    teamAccounts += '<dd class="account-item" data-id="'+data.team[i]['id']+'">'+data.team[i]['name']+' <i class="iconfont icon-right"></i></dd>';
                }
                var userAccounts  = '<dd class="account-item" data-id="'+data.prototype.id+'">'+data.prototype.name+' <i class="iconfont icon-right"></i></dd>';

                $('#form-select-account .team-accounts').append(teamAccounts);
                $('#form-select-account .user-accounts').append(userAccounts);

                window.setTimeout(function () {
                    $('#form-login').hide();
                    $('#form-select-account').addClass('animation-fadeInRight').show();
                }, 400);
            },
            error: function (data, status, msg) {
                $.message.warn(msg);
            },
        });
    };

    $('#form-select-account').on('click', '.account-item', function () {
        $.http.get('/auth/switch/' + $(this).data('id'));
    });
});

// ============================
// 授权认证 - 设置ES地址
// ============================
$(function () {
    if ($('body').data('location') != 'auth/es') return;

    $('[name="protocol"]').select({placeholder: '请选择协议'});

    $('#form-esCluster').validator({
        rules:{
            protocol: 'required',
            host : 'required',
            port : 'required|int',
        }
    }).submit(function () {
        // 是否验证通过
        var validator = $(this).data('instance.validator');
        if (!validator.isValid()) return false;

        // 异步提交
        var $submit = $('button[type="submit"]', $(this));
        $submit.loading('start');

        $.http.post('/es/cluster', {
            id: '',
            url: $.getValByName('protocol', $(this)) + '://' + $.getValByName('host', $(this)) + ':' + $.getValByName('port', $(this)),
        }, {
            success: function () {
                $.message.tip('设置成功', function () {
                    window.location.href = '/setting/es';
                });
            },
            
            error: function (data, status, message) {
                $.message.warn(message);
            },

            complete: function () {
                $submit.loading('done');
            },
        });

        return false;
    });
});


// ============================
// 授权认证 - 登录背景
// ============================
$(function () {
    "use strict";
    var canvas = document.getElementById('bg-login');
    if (!canvas) return;

    var ctx = canvas.getContext('2d'),
        w = canvas.width = window.innerWidth,
        h = canvas.height = window.innerHeight,

        hue = 217,
        stars = [],
        count = 0,
        maxStars = 1200;

    var canvas2 = document.createElement('canvas'),
        ctx2 = canvas2.getContext('2d');
    canvas2.width = 100;
    canvas2.height = 100;
    var half = canvas2.width / 2,
        gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
    gradient2.addColorStop(0.025, '#fff');
    gradient2.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
    gradient2.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
    gradient2.addColorStop(1, 'transparent');

    ctx2.fillStyle = gradient2;
    ctx2.beginPath();
    ctx2.arc(half, half, half, 0, Math.PI * 2);
    ctx2.fill();

    // End cache

    function random(min, max) {
        if (arguments.length < 2) {
            max = min;
            min = 0;
        }

        if (min > max) {
            var hold = max;
            max = min;
            min = hold;
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function maxOrbit(x, y) {
        var max = Math.max(x, y),
            diameter = Math.round(Math.sqrt(max * max + max * max));
        return diameter / 2;
    }

    var Star = function() {

        this.orbitRadius = random(maxOrbit(w, h));
        this.radius = random(60, this.orbitRadius) / 12;
        this.orbitX = w / 2;
        this.orbitY = h / 2;
        this.timePassed = random(0, maxStars);
        this.speed = random(this.orbitRadius) / 900000;
        this.alpha = random(2, 10) / 10;

        count++;
        stars[count] = this;
    }

    Star.prototype.draw = function() {
        var x = Math.sin(this.timePassed) * this.orbitRadius + this.orbitX,
            y = Math.cos(this.timePassed) * this.orbitRadius + this.orbitY,
            twinkle = random(10);

        if (twinkle === 1 && this.alpha > 0) {
            this.alpha -= 0.05;
        } else if (twinkle === 2 && this.alpha < 1) {
            this.alpha += 0.05;
        }

        ctx.globalAlpha = this.alpha;
        ctx.drawImage(canvas2, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
        this.timePassed += this.speed;
    }

    for (var i = 0; i < maxStars; i++) {
        new Star();
    }

    function animation() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = 'hsla(' + hue + ', 64%, 6%, 1)';
        ctx.fillRect(0, 0, w, h)

        ctx.globalCompositeOperation = 'lighter';
        for (var i = 1, l = stars.length; i < l; i++) {
            stars[i].draw();
        };

        window.requestAnimationFrame(animation);
    }

    animation();
});