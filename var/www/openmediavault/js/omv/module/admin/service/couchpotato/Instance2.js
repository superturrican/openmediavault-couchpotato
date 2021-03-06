/**
 * Copyright (C) 2013-2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/form/plugin/LinkedFields.js")

Ext.define("OMV.module.admin.service.couchpotato.Instance2", {
    extend: "OMV.workspace.form.Panel",
    requires: [
        "OMV.data.Model",
        "OMV.data.Store"
    ],

    rpcService   : "Couchpotato",
    rpcGetMethod : "getSettings2",
    rpcSetMethod : "setSettings2",

    initComponent: function() {
        this.on("load", function() {
            var checked = this.findField("enable").checked;
            var showtab = this.findField("showtab").checked;
            var parent = this.up("tabpanel");

            if (!parent) {
                return;
            }

            var managementPanel = parent.down("panel[title=" + _("Web Interface2") + "]");

            if (managementPanel) {
                checked ? managementPanel.enable() : managementPanel.disable();
                showtab ? managementPanel.tab.show() : managementPanel.tab.hide();
            }
        }, this);

        this.callParent(arguments);
    },

    plugins      : [{ 
        ptype        : "linkedfields", 
        correlations : [{ 
            name       : [ 
                "port", 
            ], 
            properties : "!show" 
        }]
    }],

    getButtonItems: function() {
        var items = this.callParent(arguments);

        items.push({
            id: this.getId() + "-show",
            xtype: "button",
            text: _("Open Web Client"),
            icon: "images/couchpotato.png",
            iconCls: Ext.baseCSSPrefix + "btn-icon-16x16",
            scope: this,
            handler: function() {
                var proxy = this.getForm().findField("ppass").getValue();
                if (proxy == true) {
                    var link = "http://" + location.hostname + "/couchpotato/";
                } else {
                    var port = this.getForm().findField("port").getValue();
                    var link = "http://" + location.hostname + ":" + port + "/";
                }
                window.open(link, "_blank");
            }
        }, {
            id: this.getId() + '-backup',
            xtype: 'button',
            text: _('Backup'),
            icon: 'images/wrench.png',
            iconCls: Ext.baseCSSPrefix + 'btn-icon-16x16',
            scope: this,
            handler: Ext.Function.bind(this.onBackupButton, this)
        }, {
            id: this.getId() + '-restore',
            xtype: 'button',
            text: _('Restore'),
            icon: 'images/wrench.png',
            iconCls: Ext.baseCSSPrefix + 'btn-icon-16x16',
            scope: this,
            handler: Ext.Function.bind(this.onRestoreButton, this)
        });

        return items;
    },

    getFormItems : function() {
        return [{
            xtype    : "fieldset",
            title    : "General settings",
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype      : "checkbox",
                name       : "enable",
                fieldLabel : _("Enable"),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "showtab",
                fieldLabel : _("Show Tab"),
                boxLabel   : _("Show tab containing Couchpotato web interface frame."),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "ssl",
                fieldLabel : _("SSL"),
                boxLabel   : _("Auto enable SSL. An OpenMediaVault certificate must have been generated."),
                checked    : false
            },{
                xtype      : "checkbox",
                name       : "ppass",
                fieldLabel : _("Proxy Pass"),
                boxLabel   : _("Enable this to access via OMV_IP/couchpotato"),
                checked    : false
            },{
                xtype      : "combo",
                name       : "repo",
                fieldLabel : _("Repository"),
                store: Ext.create("OMV.data.Store", {
                    autoLoad: true,
                    model: OMV.data.Model.createImplicit({
                        idProperty: "name",
                        fields: [{
                            name: "uuid",
                            type: "string"
                        }, {
                            name: "name",
                            type: "string"
                        }, {
                            name: "fork",
                            type: "string"
                        }, {
                            name: "branches",
                            type: "array"
                        }],
                        proxy: {
                            type    : "rpc",
                            rpcData : {
                                service : "Couchpotato",
                                method  : "enumerateRepos"
                            },
                            appendSortParams : false
                        }
                    })
                }),
                allowBlank: false,
                displayField: "fork",
                editable: false,
                listeners: {
                    scope: this,
                    change: function(combo, value) {
                        var record = combo.store.findRecord("fork", value);

                        if (record != null) {
                            this.updateBranchCombo(record.get("branches"));
                        }
                    },
                    select: function(combo, records) {
                        if (records === Array) {
                            var record = records.pop();
                        }

                        if (record != null) {
                            this.updateBranchCombo(record.get("branches"));
                        }
                    }
                },
                queryMode: "local",
                selectOnFocus: true,
                triggerAction: "all",
                valueField: "fork",
                plugins: [{
                    ptype: "fieldinfo",
                    text: _("The repository you want to use. If changing from a current repository, setting will be wiped.")
                }]
            }, {
                xtype: "combo",
                name: "branch",
                fieldLabel: _("Branch"),
                allowBlank: false,
                editable: false,
                queryMode: "local",
                store: [],
                triggerAction: "all",
                plugins: [{
                    ptype: "fieldinfo",
                    text: _("The branch you want to use. choose master if you don't know what's involved.")
                }]
            },{
                xtype: "numberfield",
                name: "port",
                fieldLabel: _("Port"),
                vtype: "port",
                minValue: 1,
                maxValue: 65535,
                allowDecimals: false,
                allowBlank: false,
                value: 8081
            }]
            },{
            xtype    : "fieldset",
            title    : "Custom user settings",
            defaults : {
                labelSeparator : ""
            },
            items : [{
                xtype      : "usercombo",
                name       : "username",
                fieldLabel : _("Run as User"),
                value      : "couchpotato"
            }, {
                xtype      : "checkbox",
                name       : "usersgrp",
                fieldLabel : _("Users group"),
                boxLabel   : _("Will run SB under the users group. Not recommended."),
                checked    : false
            }, {
                xtype: "combo",
                name: "umask",
                fieldLabel: _("Umask"),
                queryMode: "local",
                store: Ext.create("Ext.data.ArrayStore", {
                    fields: [
                        "value",
                        "text"
                    ],
                    data: [
                        ["000", _("000 - allow read/write and execute permission for all (potential security risk)")],
                        ["077", _("073 - read/write and execute permission for the file's owner only")],
                        ["113", _("113 - allow read/write permissions for owner/group, but not execute permission")]
                    ]
                }),
                displayField: "text",
                valueField: "value",
                allowBlank: false,
                editable: false,
                triggerAction: "all",
                value: "000",
                plugins: [{
                    ptype: "fieldinfo",
                    text: _("Sets Couchpotatos file mode creation mask.")
                }]
            },{
                xtype         : "combo",
                name          : "mntentref",
                fieldLabel    : _("Settings Volume"),
                emptyText     : _("Select a volume or leave blank for default."),
                allowBlank    : true,
                allowNone     : true,
                editable      : false,
                triggerAction : "all",
                displayField  : "description",
                valueField    : "uuid",
                store         : Ext.create("OMV.data.Store", {
                    autoLoad : true,
                    model    : OMV.data.Model.createImplicit({
                        idProperty : "uuid",
                        fields     : [
                            { name  : "uuid", type : "string" },
                            { name  : "devicefile", type : "string" },
                            { name  : "description", type : "string" }
                        ]
                    }),
                    proxy    : {
                        type    : "rpc",
                        rpcData : {
                            service : "ShareMgmt",
                            method  : "getCandidates"
                        },
                        appendSortParams : false
                    },
                    sorters  : [{
                        direction: "ASC",
                        property: "devicefile"
                    }]
                }),
                plugins : [{
                    ptype : "fieldinfo",
                    text  : _("Settings folder location, existing settings will be moved if settings volume is changed.")
                }]
            },{
                xtype      : "textfield",
                name       : "db-folder",
                fieldLabel : _("Settings Folder"),
                allowNone  : true,
                readOnly   : true
            }]
        }];
    },

    updateBranchCombo : function(values) {
        var me = this;
        var branchCombo = me.findField("branch");

        branchCombo.store.removeAll();

        for (var i = 0; i < values.length; i++) {
            // TODO: Look over use of field1
            branchCombo.store.add({ field1: values[i] });
        }
    },

    onBackupButton: function() {
        OMV.Download.request('Couchpotato', 'downloadBackup2');
    },

    onRestoreButton: function() {
        Ext.create('OMV.window.Upload', {
            title: _('Upload backup'),
            service: 'Couchpotato',
            method: 'uploadBackup2',
            listeners: {
                scope: this,
                success: function(wnd, response) {
                    OMV.MessageBox.info(_('Restored backup'), _('Backup was successfully restored.'));
                }
            }
        }).show();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "instance2",
    path      : "/service/couchpotato",
    text      : _("Instance 2"),
    position  : 30,
    className : "OMV.module.admin.service.couchpotato.Instance2"
});
