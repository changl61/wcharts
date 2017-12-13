<?php
use Phalcon\Paginator\Adapter\Model as PaginatorModel;

/**
 * --------------------------------
 * 工具箱 -- 有用的小工具函数
 * --------------------------------
 */
class Utils
{
    /**
     * 获取当前毫秒级级时间戳
     *
     * @return int Milli second timestamp
     */
    public static function getMillisecond() {
        list($t1, $t2) = explode(' ', microtime());
        return (float)sprintf('%.0f',(floatval($t1)+floatval($t2))*1000);
    }

    public static function explodeThenTrim($delimiter, $string)
    {
        $rude = explode($delimiter, $string);

        $fine = [];
        foreach ($rude as $str) {
            $fine[] = trim($str);
        }

        return $fine;
    }


    /**
     * "时间范围描述文本"转换为"毫秒级时间范围数组"
     * @param  $timeRangeText
     * @return array           ['start'=>, 'end'=>]
     */
    public static function toMillisecondRange($timeRangeText)
    {
        $arr = self::explodeThenTrim('~', $timeRangeText);
        return [
            'start' => strtotime($arr[0])*1000,
            'end' => strtotime($arr[1])*1000 - 1
        ];
    }

    /**
     * "相对时间描述文本"转换为"时间描述文本"
     * @param $text "相对时间描述文本", 如"最近24小时"
     */
    public static function toTimeRangText($relativeTimeRangeText)
    {
        $end = date('Y-m-d H:i:s');

        switch ($relativeTimeRangeText) {
            case '最近1分钟' : $start = date('Y-m-d H:i:s', strtotime('-1 minute')); break;
            case '最近5分钟' : $start = date('Y-m-d H:i:s', strtotime('-5 minute')); break;
            case '最近10分钟': $start = date('Y-m-d H:i:s', strtotime('-10 minute')); break;
            case '最近15分钟': $start = date('Y-m-d H:i:s', strtotime('-15 minute')); break;
            case '最近30分钟': $start = date('Y-m-d H:i:s', strtotime('-30 minute')); break;

            case '最近1小时' : $start = date('Y-m-d H:i:s', strtotime('-1 hour')); break;
            case '最近3小时' : $start = date('Y-m-d H:i:s', strtotime('-3 hour')); break;
            case '最近6小时' : $start = date('Y-m-d H:i:s', strtotime('-6 hour')); break;
            case '最近12小时': $start = date('Y-m-d H:i:s', strtotime('-12 hour')); break;
            case '最近24小时': $start = date('Y-m-d H:i:s', strtotime('-24 hour')); break;

            case '今天'     : $start = date('Y-m-d 00:00:00'); break;
            case '昨天'     : $start = date('Y-m-d 00:00:00', strtotime('-1 day')); $end = date('Y-m-d 00:00:00'); break;
            case '最近7天'  : $start = date('Y-m-d H:i:s', strtotime('-7 day')); break;
            case '最近15天' : $start = date('Y-m-d H:i:s', strtotime('-15 day')); break;
            case '最近30天' : $start = date('Y-m-d H:i:s', strtotime('-30 day')); break;

            case '本月'     : $start = date('Y-m-01 00:00:00'); break;
            case '上月'     : $start = date('Y-m-01 00:00:00', strtotime('-1 month')); $end = date('Y-m-01 00:00:00'); break;
            case '最近3个月' : $start = date('Y-m-d H:i:s', strtotime('-3 month')); break;
            case '最近6个月' : $start = date('Y-m-d H:i:s', strtotime('-6 month')); break;
            case '最近12个月': $start = date('Y-m-d H:i:s', strtotime('-12 month')); break;

            default : $start = date('Y-m-d H:i:s', strtotime('-24 hour')); break;
        }

        return $start.' ~ '.$end;
    }

    /**
     * 是否为"相对时间描述文本"
     * @param $text "相对时间描述文本", 如"最近24小时"
     */
    public static function isRelativeTimeRangeText($text)
    {
        return strpos($text, '~') <= 0;
    }


    /**
     * 以text文件形式输出
     * @param $filename string 文件名
     * @param $text     string 文件内容
     */
    public static function respondText($filename, $text)
    {
        header("Content-type: text/plain");
        header("Accept-Ranges: bytes");
        header("Content-Disposition: attachment; filename=".$filename);
        header("Cache-Control: must-revalidate, post-check=0, pre-check=0" );
        header("Pragma: no-cache" );
        header("Expires: 0" );
        exit($text);
    }
}