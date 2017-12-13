$(function () {
    // 页面切换动画
    $('.app-musk').fadeOut(1000);

    // 工具提示
    $('[data-toggle="tooltip"]').tooltip({container: 'body'});

    // 回到顶部
    $('.app-handles [handle="goToTop"]').click(function () {
        $('html,body').animate({scrollTop: '0px'}, 300);
    });

    // 全屏/退出全屏
    $('.app-handles [handle="fullScreen"]').click(function () {
        if ($(this).data('full')) {
            $('.app-right').animate({paddingLeft: '60px'}, 500, function () {
                $(this).trigger('resize');
            });
            $('.app-main').animate({marginTop: '48px'}, 500);
            $('.app-left').delay(500).show();
            $('.app-tab').delay(500).show();
            $(this).data('full', 0);
        } else {
            $('.app-left').hide();
            $('.app-tab').hide();
            $('.app-right').animate({paddingLeft: '0px'}, 500, function () {
                $(this).trigger('resize');
            });
            $('.app-main').animate({marginTop: '10px'}, 500);
            $(this).data('full', 1);
        }
    });

    // 退出登录
    $('[handle="logout"]').click(function () {
        $.http.get('/team/accounts', {}, {
            success: function (data) {
                $('#modal-switch-account .account-item').remove();

                if (data.team.length) {
                    var teamAccounts = '';
                    for (var i = 0; i < data.team.length; i++) {
                        teamAccounts += '<dd class="account-item" data-id="'+data.team[i]['id']+'">'+data.team[i]['name']+' <i class="iconfont icon-ok"></i></dd>';
                    }
                    var userAccounts =  '<dd class="account-item" data-id="'+data.prototype.id+'">'+data.prototype.name+' <i class="iconfont icon-ok"></i></dd>';

                    $('#modal-switch-account .team-accounts').append(teamAccounts);
                    $('#modal-switch-account .user-accounts').append(userAccounts);
                    $('#modal-switch-account .account-item[data-id="'+data.activeId+'"]').addClass('active');
                    $('#modal-switch-account').modal('show');
                } else {
                    window.location.href = '/auth/logout';
                }
            },
            error: function (data, status, msg) {
                $.message.warn(msg);
            },
        });
    });

    // 切换账户
    $('#modal-switch-account').on('click', '.account-item:not(.active)', function () {
        $.http.get('/auth/switch/' + $(this).data('id'));
    });
});