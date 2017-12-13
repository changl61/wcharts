<?php
/**
 * --------------------------------
 * 表单验证基类
 * --------------------------------
 * 如何使用:
 *
 * 1. 子类定义参见"FormForSyslog.php"
 * 2. $form = new FormForSyslog($this->request->getPost());
 *    $form->validate()
 *    $form->getErrors()
 *    $form->getErrorString()
 * 3. "基础内置验证方法"之外的方法可以在子类中自定义
 */

class BaseValidator
{
    // 基础内置验证方法
    protected static $_baseValidators = [
        'required',         // 必填 true
        'safe',             // SQL安全 true
        'exist',            // 存在 true
        'unique',           // 唯一 true
        // 类型
        'bool',             // 布尔型 true
        'int',              // 整形 true
        'number',           // 数字 true
        'json',             // JSON格式true
        // 比较
        'length',           // 字符串范围 [5, 10]
        'shortThan',        // 字符串长度少于 10
        'longThen',         // 字符串长度多于 5
        'shortThanAttr',    // 字符串长度少于某个字段 'some-field'
        'longThenAttr',     // 字符串长度多于某个字段 'some-field'
        'range',            // 数字范围 [10, 100]
        'lessThan',         // 数字小于 100
        'grantThan',        // 数字大于 10
        'lessThanAttr',     // 数字小于某个字段 'some-field'
        'grantThanAttr',    // 数字大于某个字段 'some-field'
        'in',               // 包含 ["a", 1]
        'notIn',            // 不包含 ["a", 1]
        // 匹配
        'match',            // 正则匹配 /.../
        'date',             // 日期格式 true
        'url',              // 链接格式 true
        'email',            // 邮件格式 true
        'multyEmail',       // 多个邮件格式 默认','分隔, '@lineBreak'代表换行(\n)分隔
        'mobile',           // 手机号格式 true
        'multyMobile',      // 多个手机号格式 默认','分隔, '@lineBreak'代表换行(\n)分隔
        'zipCode',          // 邮编格式 true
        'file',             // 文件格式 true
        'noBlank',          // 不能有空格
        'grok',             // grok正则捕获规则
        'standardVarName',  // 标准变量名, 字母开头+(字母/数字/下划线)

    ];
    protected $_names   = [];
    protected $_rules   = [];
    protected $_errors  = [];
    protected $_request = [];
    protected $_childrenAttrKeys = [];

    /**
     * 构造函数
     *
     * @param $requestData 提交的数据
     */
    public function __construct($requestData)
    {
        $this->_request = $requestData;
        $this->setAttrs();
    }

    /**
     * 验证方法
     *
     * @return $this
     */
    public function validate()
    {
        foreach ($this->_rules as $attr => $validators) {
            foreach ($validators as $validatorKey => $v) {
                $validator = $validatorKey;
                !is_array($v) && ($v = []);
                $param = isset($v['param']) ? $v['param'] : NULL;
                $message = isset($v['message']) ? $v['message'] : NULL;

                if (in_array($validatorKey, self::$_baseValidators)) $validator = 'baseValidator_' . $validatorKey;
                if (method_exists($this, $validator)) $this->$validator($attr, $validatorKey, $param, $message);
            }
        }

        return $this;
    }

    /**
     * 获取错误消息
     *
     * @return array
     */
    public function getErrors()
    {
        return $this->_errors;
    }

    /**
     * 获取错误消息的文本描述
     *
     * @return string
     */
    public function getErrorString()
    {
        $errorArr = [];
        foreach ($this->_errors as $attr => $errors) {
            $attrName = $this->getAttrName($attr);
            $attrErrors = [];
            foreach ($errors as $error) {
                $attrErrors[] = $error['message'];
            }
            $errorArr[] = '"'.$attrName.'"'.join('且', $attrErrors);
        }

        return join(', ', $errorArr);
    }

    /**
     * 以数组形式输出
     *
     * @return array
     */
    public function toArray()
    {
        $arr = [];
        foreach ($this->getChildrenAttrKeys() as $attr) {
            $arr[$attr] = $this->$attr;
        }
        return $arr;
    }

    /**
     * 整体赋值到指定的对象
     *
     * @param  object $object      指定的对象
     * @param  array  $exceptAttrs 排除的属性键名
     * @return $this
     */
    public function assignToObjectExcept(&$object, $exceptAttrs = [])
    {
        foreach ($this->getChildrenAttrKeys() as $attr) {
            if (!in_array($attr, $exceptAttrs)) {
                $object->$attr = $this->$attr;
            }
        }

        return $this;
    }

    private function setAttrs()
    {
        foreach ($this->_request as $k => $v) {
            $this->$k = $v;
        }
    }

    protected function setError($attr, $key, $message)
    {
        $this->_errors[$attr][] = ['key'=>$key, 'message'=>$message];
        return false;
    }

    protected function getAttrName($attr)
    {
        return $this->_names[$attr];
    }

    protected function getChildrenAttrKeys()
    {
        if (!empty($this->_ChildrenAttrKeys)) return $this->_childrenAttrKeys;

        $ref = new ReflectionClass($this);
        foreach ($ref->getProperties() as $property) {
            if ($property->class != 'BaseValidator') {
                if (strpos($property->name, '_') !== 0) {
                    $this->_childrenAttrKeys[] = $property->name;
                }
            }
        }

        return $this->_childrenAttrKeys;
    }

    /*-----------------------------------
      基本验证方法
    -----------------------------------*/
    private function baseValidator_required($attr, $key, $param, $message)
    {
        $message || ($message = '是必填项');
        if (!isset($this->$attr) || $this->$attr == '') {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_int($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '要求为整数');
        if (!self::isInt($this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_number($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '要求为整数或小数');
        if (!self::isNumber($this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_json($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '要求为JSON格式');
        if (!is_array(json_decode($this->$attr, true))) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_in($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '不在可选列表中');
        if (!in_array($this->$attr, $param)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_safe($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '含有不非法字符');
        if (preg_match('/[\*\=\'\"\;\/\?\%\!\`]/', $this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_match($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '不符合所要求的格式');
        if (!preg_match($param, $this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_email($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '不是合法的邮件地址');
        if (!self::isEmail($this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_multyEmail($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '不是合法的邮件地址');

        $separator = $param ? $param : ',';
        if ($separator == '@lineBreak') {
            // 换行符(IE:\r\n, 其他:\n)
            $this->$attr = str_replace("\r", '', $this->$attr);
            $separator = "\n";
        }

        $arr = explode($separator, $this->$attr);
        foreach ($arr as $item) {
            if (!self::isEmail($item)) {
                return false;
            }
        }

        return true;
    }

    private function baseValidator_mobile($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '不是合法的11位手机号码');
        if (!self::isMobile($this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_multyMobile($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '不是合法的手机号码');

        $separator = $param ? $param : ',';
        if ($separator == '@lineBreak') {
            // 换行符(IE:\r\n, 其他:\n)
            $this->$attr = str_replace("\r", '', $this->$attr);
            $separator = "\n";
        }

        $arr = explode($separator, $this->$attr);
        foreach ($arr as $item) {
            if (!self::isNumber($item)) {
                return false;
            }
        }

        return true;
    }

    private function baseValidator_noBlank($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '不允许有空格');
        if (preg_match('/\s/', $this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_grok($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '不是有效的的Grok捕获规则');
        if (!preg_match('/<[^<>]+>/', $this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    private function baseValidator_specialGrok($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;

        $message || ($message = '捕获字段的名称只允许字母或数字');
        if (preg_match_all('/<[a-zA-Z0-9]+>/', $this->$attr) != preg_match('/<[^<>]+>/', $this->$attr)) {
            $this->setError($attr, $key, $message);
        }
    }

    /*-----------------------------------
      静态方法
    -----------------------------------*/
    public static function isInt($str)
    {
        return (bool) preg_match('/\d+/', $str);
    }

    public static function isNumber($str)
    {
        return (bool) preg_match('/^\d+(\.\d+)?$/', $str);
    }

    public static function isEmail($str)
    {
        return (bool) preg_match('/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/', $str);
    }

    public static function isMobile($str)
    {
        return (bool) preg_match('/^1[34578][0-9]{9}$/', $str);
    }
}