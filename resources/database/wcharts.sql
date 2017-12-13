/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 50716
 Source Host           : localhost
 Source Database       : wcharts

 Target Server Type    : MySQL
 Target Server Version : 50716
 File Encoding         : utf-8

 Date: 12/08/2017 10:49:09 AM
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `chart`
-- ----------------------------
DROP TABLE IF EXISTS `chart`;
CREATE TABLE `chart` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL,
  `format` enum('line','bar','pie','panel','radar','table') NOT NULL COMMENT '图表形式',
  `indexId` int(10) NOT NULL,
  `builder` text NOT NULL COMMENT '图表构造',
  `dashboardId` int(10) NOT NULL COMMENT '所属面板ID',
  `userId` int(11) NOT NULL,
  `createTime` datetime DEFAULT NULL,
  `updateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `indexId` (`indexId`),
  KEY `dashboardId` (`dashboardId`),
  KEY `dashboardId_2` (`dashboardId`),
  CONSTRAINT `chart_ibfk_1` FOREIGN KEY (`indexId`) REFERENCES `es_index` (`id`),
  CONSTRAINT `chart_ibfk_2` FOREIGN KEY (`dashboardId`) REFERENCES `dashboard` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COMMENT='图表';

-- ----------------------------
--  Table structure for `dashboard`
-- ----------------------------
DROP TABLE IF EXISTS `dashboard`;
CREATE TABLE `dashboard` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '面板名称',
  `grid` text NOT NULL COMMENT '栅格布局',
  `sort` int(11) NOT NULL DEFAULT '100' COMMENT '排序值',
  `groupId` int(10) NOT NULL COMMENT '分组ID',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `groupId` (`groupId`),
  CONSTRAINT `dashboard_ibfk_1` FOREIGN KEY (`groupId`) REFERENCES `dashboard_group` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8 COMMENT='图表面板';

-- ----------------------------
--  Table structure for `dashboard_group`
-- ----------------------------
DROP TABLE IF EXISTS `dashboard_group`;
CREATE TABLE `dashboard_group` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '面板名称',
  `clusterId` int(10) NOT NULL COMMENT '所属用户ID',
  `sort` int(11) NOT NULL DEFAULT '100' COMMENT '排序值',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`clusterId`),
  CONSTRAINT `dashboard_group_ibfk_1` FOREIGN KEY (`clusterId`) REFERENCES `es_cluster` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8 COMMENT='图表面板分组';

-- ----------------------------
--  Table structure for `es_cluster`
-- ----------------------------
DROP TABLE IF EXISTS `es_cluster`;
CREATE TABLE `es_cluster` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `url` varchar(255) NOT NULL COMMENT '集群地址',
  `version` varchar(255) NOT NULL COMMENT '集群版本',
  `status` enum('0','1') NOT NULL DEFAULT '0' COMMENT '状态  0:未使用 1:使用中',
  `userId` int(11) NOT NULL COMMENT '所属用户',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `es_cluster_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8 COMMENT='ES集群';

-- ----------------------------
--  Table structure for `es_index`
-- ----------------------------
DROP TABLE IF EXISTS `es_index`;
CREATE TABLE `es_index` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '索引/文档类型',
  `index` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `mapping` text NOT NULL COMMENT '字段映射',
  `defaultDateField` varchar(255) NOT NULL DEFAULT '' COMMENT '默认日期字段',
  `comment` varchar(255) DEFAULT NULL COMMENT '备注',
  `sort` int(11) NOT NULL DEFAULT '100' COMMENT '排序值',
  `clusterId` int(255) NOT NULL COMMENT 'ES集群ID',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `clusterId` (`clusterId`),
  CONSTRAINT `es_index_ibfk_1` FOREIGN KEY (`clusterId`) REFERENCES `es_cluster` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8 COMMENT='ES索引\n';

-- ----------------------------
--  Table structure for `privilege`
-- ----------------------------
DROP TABLE IF EXISTS `privilege`;
CREATE TABLE `privilege` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `controller` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `role` enum('guest','user','admin','team.admin','team.user.write','team.user.read') NOT NULL DEFAULT 'user' COMMENT '角色(''user'':''普通用户'', ''admin'':''管理员'',''team'':''团队'')',
  `accessible` enum('yes','no') NOT NULL DEFAULT 'yes',
  `createTime` datetime DEFAULT NULL,
  `updateTime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=281 DEFAULT CHARSET=utf8 COMMENT='权限';

-- ----------------------------
--  Records of `privilege`
-- ----------------------------
BEGIN;
INSERT INTO `privilege` VALUES ('1', 'auth', 'index', 'guest', 'yes', null, null), ('2', 'auth', 'login', 'guest', 'yes', null, null), ('3', 'errors', 'show403', 'guest', 'yes', null, null), ('4', 'errors', 'show404', 'guest', 'yes', null, null), ('5', 'errors', 'show500', 'guest', 'yes', null, null), ('6', 'share', 'detail', 'guest', 'yes', null, null), ('7', 'share', 'search', 'guest', 'yes', null, null), ('8', 'auth', 'index', 'user', 'yes', null, null), ('9', 'auth', 'login', 'user', 'yes', null, null), ('10', 'auth', 'logout', 'user', 'yes', null, null), ('11', 'auth', 'es', 'user', 'yes', null, null), ('12', 'auth', 'switch', 'user', 'yes', null, null), ('13', 'errors', 'show403', 'user', 'yes', null, null), ('14', 'errors', 'show404', 'user', 'yes', null, null), ('15', 'errors', 'show500', 'user', 'yes', null, null), ('16', 'index', 'index', 'user', 'yes', null, null), ('17', 'dashboard', 'index', 'user', 'yes', null, null), ('18', 'dashboard', 'detail', 'user', 'yes', null, null), ('19', 'dashboard', 'create', 'user', 'yes', null, null), ('20', 'dashboard', 'save', 'user', 'yes', null, null), ('21', 'dashboard', 'delete', 'user', 'yes', null, null), ('22', 'dashboard', 'saveGrid', 'user', 'yes', null, null), ('23', 'query', 'index', 'user', 'yes', null, null), ('24', 'query', 'detail', 'user', 'yes', null, null), ('25', 'query', 'create', 'user', 'yes', null, null), ('26', 'query', 'save', 'user', 'yes', null, null), ('27', 'query', 'delete', 'user', 'yes', null, null), ('28', 'query', 'builder', 'user', 'yes', null, null), ('29', 'query', 'table', 'user', 'yes', null, null), ('30', 'share', 'search', 'user', 'yes', null, null), ('31', 'share', 'detail', 'user', 'yes', null, null), ('32', 'share', 'create', 'user', 'yes', null, null), ('33', 'share', 'update', 'user', 'yes', null, null), ('34', 'share', 'delete', 'user', 'yes', null, null), ('35', 'setting', 'index', 'user', 'yes', null, null), ('36', 'setting', 'es', 'user', 'yes', null, null), ('37', 'setting', 'query', 'user', 'yes', null, null), ('38', 'setting', 'saveGroup', 'user', 'yes', null, null), ('39', 'setting', 'deleteGroup', 'user', 'yes', null, null), ('40', 'setting', 'dashboard', 'user', 'yes', null, null), ('41', 'setting', 'saveDashboardGroup', 'user', 'yes', null, null), ('42', 'setting', 'deleteDashboardGroup', 'user', 'yes', null, null), ('43', 'setting', 'deleteDashboardGroup', 'user', 'yes', null, null), ('44', 'setting', 'share', 'user', 'yes', null, null), ('45', 'setting', 'team', 'user', 'yes', null, null), ('46', 'team', 'create', 'user', 'yes', null, null), ('47', 'team', 'update', 'user', 'yes', null, null), ('48', 'team', 'delete', 'user', 'yes', null, null), ('49', 'team', 'quit', 'user', 'yes', null, null), ('50', 'team', 'accounts', 'user', 'yes', null, null), ('51', 'es', 'cluster', 'user', 'yes', null, null), ('52', 'es', 'index', 'user', 'yes', null, null), ('53', 'es', 'switch', 'user', 'yes', null, null), ('54', 'es', 'statistics', 'user', 'yes', null, null), ('55', 'es', 'search', 'user', 'yes', null, null), ('56', 'option', 'user', 'user', 'yes', null, null), ('57', 'option', 'esTypes', 'user', 'yes', null, null), ('58', 'option', 'esMapping', 'user', 'yes', null, null), ('59', 'option', 'dashboard', 'user', 'yes', null, null), ('60', 'auth', 'index', 'admin', 'yes', null, null), ('61', 'auth', 'login', 'admin', 'yes', null, null), ('62', 'auth', 'logout', 'admin', 'yes', null, null), ('63', 'auth', 'es', 'admin', 'yes', null, null), ('64', 'auth', 'switch', 'admin', 'yes', null, null), ('65', 'errors', 'show403', 'admin', 'yes', null, null), ('66', 'errors', 'show404', 'admin', 'yes', null, null), ('67', 'errors', 'show500', 'admin', 'yes', null, null), ('68', 'index', 'index', 'admin', 'yes', null, null), ('69', 'dashboard', 'index', 'admin', 'yes', null, null), ('70', 'dashboard', 'detail', 'admin', 'yes', null, null), ('71', 'dashboard', 'create', 'admin', 'yes', null, null), ('72', 'dashboard', 'save', 'admin', 'yes', null, null), ('73', 'dashboard', 'delete', 'admin', 'yes', null, null), ('74', 'dashboard', 'saveGrid', 'admin', 'yes', null, null), ('75', 'query', 'index', 'admin', 'yes', null, null), ('76', 'query', 'detail', 'admin', 'yes', null, null), ('77', 'query', 'create', 'admin', 'yes', null, null), ('78', 'query', 'save', 'admin', 'yes', null, null), ('79', 'query', 'delete', 'admin', 'yes', null, null), ('80', 'query', 'builder', 'admin', 'yes', null, null), ('81', 'query', 'table', 'admin', 'yes', null, null), ('82', 'share', 'search', 'admin', 'yes', null, null), ('83', 'share', 'detail', 'admin', 'yes', null, null), ('84', 'share', 'create', 'admin', 'yes', null, null), ('85', 'share', 'update', 'admin', 'yes', null, null), ('86', 'share', 'delete', 'admin', 'yes', null, null), ('87', 'setting', 'index', 'admin', 'yes', null, null), ('88', 'setting', 'es', 'admin', 'yes', null, null), ('89', 'setting', 'query', 'admin', 'yes', null, null), ('90', 'setting', 'saveGroup', 'admin', 'yes', null, null), ('91', 'setting', 'deleteGroup', 'admin', 'yes', null, null), ('92', 'setting', 'dashboard', 'admin', 'yes', null, null), ('93', 'setting', 'saveDashboardGroup', 'admin', 'yes', null, null), ('94', 'setting', 'deleteDashboardGroup', 'admin', 'yes', null, null), ('95', 'setting', 'deleteDashboardGroup', 'admin', 'yes', null, null), ('96', 'setting', 'share', 'admin', 'yes', null, null), ('97', 'setting', 'team', 'admin', 'yes', null, null), ('98', 'team', 'create', 'admin', 'yes', null, null), ('99', 'team', 'update', 'admin', 'yes', null, null), ('100', 'team', 'delete', 'admin', 'yes', null, null), ('101', 'team', 'quit', 'admin', 'yes', null, null), ('102', 'team', 'accounts', 'admin', 'yes', null, null), ('103', 'es', 'cluster', 'admin', 'yes', null, null), ('104', 'es', 'index', 'admin', 'yes', null, null), ('105', 'es', 'switch', 'admin', 'yes', null, null), ('106', 'es', 'statistics', 'admin', 'yes', null, null), ('107', 'es', 'search', 'admin', 'yes', null, null), ('108', 'option', 'user', 'admin', 'yes', null, null), ('109', 'option', 'esTypes', 'admin', 'yes', null, null), ('110', 'option', 'esMapping', 'admin', 'yes', null, null), ('111', 'option', 'dashboard', 'admin', 'yes', null, null), ('112', 'chart', 'index', 'admin', 'yes', null, null), ('113', 'chart', 'detail', 'admin', 'yes', null, null), ('114', 'chart', 'create', 'admin', 'yes', null, null), ('115', 'chart', 'update', 'admin', 'yes', null, null), ('116', 'chart', 'delete', 'admin', 'yes', null, null), ('117', 'chart', 'copy', 'admin', 'yes', null, null), ('118', 'chart', 'move', 'admin', 'yes', null, null), ('119', 'chart', 'index', 'user', 'yes', null, null), ('120', 'chart', 'detail', 'user', 'yes', null, null), ('121', 'chart', 'create', 'user', 'yes', null, null), ('122', 'chart', 'update', 'user', 'yes', null, null), ('123', 'chart', 'delete', 'user', 'yes', null, null), ('124', 'chart', 'copy', 'user', 'yes', null, null), ('125', 'chart', 'move', 'user', 'yes', null, null), ('126', 'auth', 'index', 'team.admin', 'yes', null, null), ('127', 'auth', 'login', 'team.admin', 'yes', null, null), ('128', 'auth', 'logout', 'team.admin', 'yes', null, null), ('129', 'auth', 'es', 'team.admin', 'yes', null, null), ('130', 'auth', 'switch', 'team.admin', 'yes', null, null), ('131', 'errors', 'show403', 'team.admin', 'yes', null, null), ('132', 'errors', 'show404', 'team.admin', 'yes', null, null), ('133', 'errors', 'show500', 'team.admin', 'yes', null, null), ('134', 'index', 'index', 'team.admin', 'yes', null, null), ('135', 'dashboard', 'index', 'team.admin', 'yes', null, null), ('136', 'dashboard', 'detail', 'team.admin', 'yes', null, null), ('137', 'dashboard', 'create', 'team.admin', 'yes', null, null), ('138', 'dashboard', 'save', 'team.admin', 'yes', null, null), ('139', 'dashboard', 'delete', 'team.admin', 'yes', null, null), ('140', 'dashboard', 'saveGrid', 'team.admin', 'yes', null, null), ('141', 'chart', 'index', 'team.admin', 'yes', null, null), ('142', 'chart', 'detail', 'team.admin', 'yes', null, null), ('143', 'chart', 'create', 'team.admin', 'yes', null, null), ('144', 'chart', 'update', 'team.admin', 'yes', null, null), ('145', 'chart', 'delete', 'team.admin', 'yes', null, null), ('146', 'chart', 'copy', 'team.admin', 'yes', null, null), ('147', 'chart', 'move', 'team.admin', 'yes', null, null), ('148', 'query', 'index', 'team.admin', 'yes', null, null), ('149', 'query', 'detail', 'team.admin', 'yes', null, null), ('150', 'query', 'create', 'team.admin', 'yes', null, null), ('151', 'query', 'save', 'team.admin', 'yes', null, null), ('152', 'query', 'delete', 'team.admin', 'yes', null, null), ('153', 'query', 'builder', 'team.admin', 'yes', null, null), ('154', 'query', 'table', 'team.admin', 'yes', null, null), ('155', 'share', 'search', 'team.admin', 'yes', null, null), ('156', 'share', 'detail', 'team.admin', 'yes', null, null), ('157', 'share', 'create', 'team.admin', 'yes', null, null), ('158', 'share', 'update', 'team.admin', 'yes', null, null), ('159', 'share', 'delete', 'team.admin', 'yes', null, null), ('160', 'setting', 'index', 'team.admin', 'yes', null, null), ('161', 'setting', 'es', 'team.admin', 'yes', null, null), ('162', 'setting', 'query', 'team.admin', 'yes', null, null), ('163', 'setting', 'saveGroup', 'team.admin', 'yes', null, null), ('164', 'setting', 'deleteGroup', 'team.admin', 'yes', null, null), ('165', 'setting', 'dashboard', 'team.admin', 'yes', null, null), ('166', 'setting', 'saveDashboardGroup', 'team.admin', 'yes', null, null), ('167', 'setting', 'deleteDashboardGroup', 'team.admin', 'yes', null, null), ('168', 'setting', 'deleteDashboardGroup', 'team.admin', 'yes', null, null), ('169', 'setting', 'share', 'team.admin', 'yes', null, null), ('170', 'setting', 'team', 'team.admin', 'yes', null, null), ('171', 'team', 'create', 'team.admin', 'yes', null, null), ('172', 'team', 'update', 'team.admin', 'yes', null, null), ('173', 'team', 'delete', 'team.admin', 'yes', null, null), ('174', 'team', 'quit', 'team.admin', 'yes', null, null), ('175', 'team', 'accounts', 'team.admin', 'yes', null, null), ('176', 'es', 'cluster', 'team.admin', 'yes', null, null), ('177', 'es', 'index', 'team.admin', 'yes', null, null), ('178', 'es', 'switch', 'team.admin', 'yes', null, null), ('179', 'es', 'statistics', 'team.admin', 'yes', null, null), ('180', 'es', 'search', 'team.admin', 'yes', null, null), ('181', 'option', 'user', 'team.admin', 'yes', null, null), ('182', 'option', 'esTypes', 'team.admin', 'yes', null, null), ('183', 'option', 'esMapping', 'team.admin', 'yes', null, null), ('184', 'option', 'dashboard', 'team.admin', 'yes', null, null), ('185', 'team', 'createUser', 'team.admin', 'yes', null, null), ('186', 'team', 'updateUser', 'team.admin', 'yes', null, null), ('187', 'team', 'deleteUser', 'team.admin', 'yes', null, null), ('188', 'setting', 'teamUser', 'team.admin', 'yes', null, null), ('189', 'auth', 'index', 'team.user.write', 'yes', null, null), ('190', 'auth', 'login', 'team.user.write', 'yes', null, null), ('191', 'auth', 'logout', 'team.user.write', 'yes', null, null), ('192', 'auth', 'es', 'team.user.write', 'yes', null, null), ('193', 'auth', 'switch', 'team.user.write', 'yes', null, null), ('194', 'errors', 'show403', 'team.user.write', 'yes', null, null), ('195', 'errors', 'show404', 'team.user.write', 'yes', null, null), ('196', 'errors', 'show500', 'team.user.write', 'yes', null, null), ('197', 'index', 'index', 'team.user.write', 'yes', null, null), ('198', 'dashboard', 'index', 'team.user.write', 'yes', null, null), ('199', 'dashboard', 'detail', 'team.user.write', 'yes', null, null), ('200', 'dashboard', 'create', 'team.user.write', 'yes', null, null), ('201', 'dashboard', 'save', 'team.user.write', 'yes', null, null), ('202', 'dashboard', 'delete', 'team.user.write', 'yes', null, null), ('203', 'dashboard', 'saveGrid', 'team.user.write', 'yes', null, null), ('204', 'chart', 'index', 'team.user.write', 'yes', null, null), ('205', 'chart', 'detail', 'team.user.write', 'yes', null, null), ('206', 'chart', 'create', 'team.user.write', 'yes', null, null), ('207', 'chart', 'update', 'team.user.write', 'yes', null, null), ('208', 'chart', 'delete', 'team.user.write', 'yes', null, null), ('209', 'chart', 'copy', 'team.user.write', 'yes', null, null), ('210', 'chart', 'move', 'team.user.write', 'yes', null, null), ('211', 'query', 'index', 'team.user.write', 'yes', null, null), ('212', 'query', 'detail', 'team.user.write', 'yes', null, null), ('213', 'query', 'create', 'team.user.write', 'yes', null, null), ('214', 'query', 'save', 'team.user.write', 'yes', null, null), ('215', 'query', 'delete', 'team.user.write', 'yes', null, null), ('216', 'query', 'builder', 'team.user.write', 'yes', null, null), ('217', 'query', 'table', 'team.user.write', 'yes', null, null), ('218', 'share', 'search', 'team.user.write', 'yes', null, null), ('219', 'share', 'detail', 'team.user.write', 'yes', null, null), ('220', 'share', 'create', 'team.user.write', 'yes', null, null), ('221', 'share', 'update', 'team.user.write', 'yes', null, null), ('222', 'share', 'delete', 'team.user.write', 'yes', null, null), ('223', 'setting', 'index', 'team.user.write', 'yes', null, null), ('224', 'setting', 'es', 'team.user.write', 'yes', null, null), ('225', 'setting', 'query', 'team.user.write', 'yes', null, null), ('226', 'setting', 'saveGroup', 'team.user.write', 'yes', null, null), ('227', 'setting', 'deleteGroup', 'team.user.write', 'yes', null, null), ('228', 'setting', 'dashboard', 'team.user.write', 'yes', null, null), ('229', 'setting', 'saveDashboardGroup', 'team.user.write', 'yes', null, null), ('230', 'setting', 'deleteDashboardGroup', 'team.user.write', 'yes', null, null), ('231', 'setting', 'deleteDashboardGroup', 'team.user.write', 'yes', null, null), ('232', 'setting', 'share', 'team.user.write', 'yes', null, null), ('233', 'es', 'cluster', 'team.user.write', 'yes', null, null), ('234', 'es', 'index', 'team.user.write', 'yes', null, null), ('235', 'es', 'switch', 'team.user.write', 'yes', null, null), ('236', 'es', 'statistics', 'team.user.write', 'yes', null, null), ('237', 'es', 'search', 'team.user.write', 'yes', null, null), ('238', 'option', 'user', 'team.user.write', 'yes', null, null), ('239', 'option', 'esTypes', 'team.user.write', 'yes', null, null), ('240', 'option', 'esMapping', 'team.user.write', 'yes', null, null), ('241', 'option', 'dashboard', 'team.user.write', 'yes', null, null), ('242', 'team', 'accounts', 'team.user.write', 'yes', null, null), ('243', 'auth', 'index', 'team.user.read', 'yes', null, null), ('244', 'auth', 'login', 'team.user.read', 'yes', null, null), ('245', 'auth', 'logout', 'team.user.read', 'yes', null, null), ('246', 'auth', 'es', 'team.user.read', 'yes', null, null), ('247', 'auth', 'switch', 'team.user.read', 'yes', null, null), ('248', 'errors', 'show403', 'team.user.read', 'yes', null, null), ('249', 'errors', 'show404', 'team.user.read', 'yes', null, null), ('250', 'errors', 'show500', 'team.user.read', 'yes', null, null), ('251', 'errors', 'show500', 'team.user.read', 'yes', null, null), ('252', 'index', 'index', 'team.user.read', 'yes', null, null), ('253', 'dashboard', 'index', 'team.user.read', 'yes', null, null), ('254', 'dashboard', 'detail', 'team.user.read', 'yes', null, null), ('255', 'chart', 'index', 'team.user.read', 'yes', null, null), ('256', 'chart', 'detail', 'team.user.read', 'yes', null, null), ('257', 'query', 'index', 'team.user.read', 'yes', null, null), ('258', 'query', 'detail', 'team.user.read', 'yes', null, null), ('259', 'query', 'builder', 'team.user.read', 'yes', null, null), ('260', 'query', 'table', 'team.user.read', 'yes', null, null), ('261', 'share', 'detail', 'team.user.read', 'yes', null, null), ('262', 'share', 'search', 'team.user.read', 'yes', null, null), ('263', 'setting', 'index', 'team.user.read', 'yes', null, null), ('264', 'setting', 'es', 'team.user.read', 'yes', null, null), ('265', 'es', 'cluster', 'team.user.read', 'yes', null, null), ('266', 'es', 'index', 'team.user.read', 'yes', null, null), ('267', 'es', 'statistics', 'team.user.read', 'yes', null, null), ('268', 'es', 'search', 'team.user.read', 'yes', null, null), ('269', 'option', 'user', 'team.user.read', 'yes', null, null), ('270', 'option', 'esTypes', 'team.user.read', 'yes', null, null), ('271', 'option', 'esMapping', 'team.user.read', 'yes', null, null), ('272', 'option', 'dashboard', 'team.user.read', 'yes', null, null), ('273', 'team', 'accounts', 'team.user.read', 'yes', null, null), ('274', 'setting', 'account', 'admin', 'yes', null, null), ('275', 'setting', 'account', 'user', 'yes', null, null), ('276', 'setting', 'user', 'admin', 'yes', null, null), ('277', 'setting', 'createUser', 'admin', 'yes', null, null), ('278', 'setting', 'updateUser', 'admin', 'yes', null, null), ('279', 'setting', 'resetPassword', 'admin', 'yes', null, null), ('280', 'setting', 'resetPassword', 'user', 'yes', null, null);
COMMIT;

-- ----------------------------
--  Table structure for `query`
-- ----------------------------
DROP TABLE IF EXISTS `query`;
CREATE TABLE `query` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '名称',
  `indexId` int(10) NOT NULL COMMENT '索引ID',
  `builder` text NOT NULL COMMENT '构造JSON',
  `groupId` int(11) NOT NULL COMMENT '分组ID',
  `sort` int(11) NOT NULL DEFAULT '100' COMMENT '排序值',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `indexId` (`indexId`),
  KEY `groupId` (`groupId`),
  CONSTRAINT `query_ibfk_1` FOREIGN KEY (`indexId`) REFERENCES `es_index` (`id`),
  CONSTRAINT `query_ibfk_2` FOREIGN KEY (`groupId`) REFERENCES `query_group` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8 COMMENT='查询';

-- ----------------------------
--  Table structure for `query_group`
-- ----------------------------
DROP TABLE IF EXISTS `query_group`;
CREATE TABLE `query_group` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '分组名称',
  `clusterId` int(10) NOT NULL COMMENT '用户ID',
  `sort` int(11) NOT NULL DEFAULT '100' COMMENT '排序值',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `userId` (`clusterId`),
  CONSTRAINT `query_group_ibfk_1` FOREIGN KEY (`clusterId`) REFERENCES `es_cluster` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8 COMMENT='查询分组';

-- ----------------------------
--  Table structure for `share`
-- ----------------------------
DROP TABLE IF EXISTS `share`;
CREATE TABLE `share` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(16) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `type` enum('query','chart','dashboard') NOT NULL COMMENT '原型类型',
  `prototypeId` int(11) NOT NULL COMMENT '原型ID',
  `count` int(11) NOT NULL COMMENT '访问次数',
  `status` enum('0','1') NOT NULL COMMENT '状态 0:不可见, 1:可见',
  `clusterId` int(11) NOT NULL,
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `clusterId` (`clusterId`),
  CONSTRAINT `share_ibfk_1` FOREIGN KEY (`clusterId`) REFERENCES `es_cluster` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COMMENT='分享链接';

-- ----------------------------
--  Table structure for `user`
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '' COMMENT '用户名',
  `password` char(32) DEFAULT '' COMMENT '密码',
  `role` enum('user','admin','team') NOT NULL DEFAULT 'user' COMMENT '角色(''user'':''普通用户'', ''admin'':''管理员'',''team'':''团队'')',
  `sessionId` varchar(255) DEFAULT '' COMMENT 'session ID',
  `status` enum('1','0','-1') NOT NULL DEFAULT '1' COMMENT '状态( ''1'':''正常'', ''0'':''禁用'', ''-1'':''删除'')',
  `loginLastTime` varchar(255) DEFAULT NULL COMMENT '上次登录的帐户',
  `loginTime` datetime DEFAULT NULL COMMENT '最后登录时间',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8 COMMENT='用户';

-- ----------------------------
--  Records of `user`
-- ----------------------------
BEGIN;
INSERT INTO `user` VALUES ('1', 'admin', '21232f297a57a5a743894a0e4a801fc3', 'admin', 'lhi10kcpm88lgjou36s7uf11m6', '1', '', '2017-12-11 10:52:28', null, '2017-12-11 10:52:28');
COMMIT;

-- ----------------------------
--  Table structure for `user_team`
-- ----------------------------
DROP TABLE IF EXISTS `user_team`;
CREATE TABLE `user_team` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `userId` int(50) NOT NULL COMMENT '用户ID',
  `role` enum('team.admin','team.user.write','team.user.read') NOT NULL DEFAULT 'team.user.read' COMMENT '角色(''team.admin'':''团队管理员'',''team.user.write'':''团队可写成员'',''team.user.read'':''团队只读成员'')',
  `teamId` int(32) NOT NULL COMMENT '密码',
  `createTime` datetime DEFAULT NULL COMMENT '创建时间',
  `updateTime` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `groupId` (`teamId`),
  KEY `name` (`userId`) USING BTREE,
  CONSTRAINT `user_team_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `user_team_ibfk_2` FOREIGN KEY (`teamId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8 COMMENT='用户团队关系';

SET FOREIGN_KEY_CHECKS = 1;
