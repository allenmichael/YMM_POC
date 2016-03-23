const Config = require('./Config');

module.exports = {
  Year: {
    "documentTypeFQN": "entityEditor@mozu",
    "listFQN": "entityEditors@mozu",
    "name": "year-editor",
    "properties": {
      "code": "Ext.create('Ext.form.Panel',{title:'YearEditor',layout:'anchor',defaults:{anchor:'100%'},defaultType:'textfield',items:[{fieldLabel:'Years',name:'years',xtype:'boxselect',store:[],queryMode:'local',forceSelection:false,createNewOnEnter:true,createNewOnBlur:true,}],setData:function(data){this.getForm().setValues(data);this.data=data;},getData:function(){vardata=this.getValues(false,false,false,true);returnExt.applyIf(data,this.data);},});",
      "entityLists": [`${Config.MZDB.YEAR}@${Config.NAMESPACE}`],
      "priority": 0
    }
  },
  YearMake: {
    "documentTypeFQN": "entityEditor@mozu",
    "listFQN": "entityEditors@mozu",
    "name": "yearmake-editor",
    "properties": {
      "code": "Ext.create('Ext.form.Panel',{title:'YearMakeEditor',layout:'anchor',defaults:{anchor:'100%'},defaultType:'textfield',items:[{fieldLabel:'Makes',name:'makes',xtype:'boxselect',store:[],queryMode:'local',forceSelection:false,createNewOnEnter:true,createNewOnBlur:true,},{fieldLabel:'Year',name:'year'}],setData:function(data){this.getForm().setValues(data);this.data=data;},getData:function(){vardata=this.getValues(false,false,false,true);returnExt.applyIf(data,this.data);},});",
      "entityLists": [`${Config.MZDB.YEARMAKE}@${Config.NAMESPACE}`],
      "priority": 0
    }
  },
  YearMakeModel: {
    "documentTypeFQN": "entityEditor@mozu",
    "listFQN": "entityEditors@mozu",
    "name": "yearmakemodel-editor",
    "properties": {
      "code": "Ext.create('Ext.form.Panel',{title:'YearMakeModelEditor',layout:'anchor',defaults:{anchor:'100%'},defaultType:'textfield',items:[{fieldLabel:'Models',name:'models',xtype:'boxselect',store:[],queryMode:'local',forceSelection:false,createNewOnEnter:true,createNewOnBlur:true,},{fieldLabel:'YearMake',name:'yearMake'}],setData:function(data){this.getForm().setValues(data);this.data=data;},getData:function(){vardata=this.getValues(false,false,false,true);returnExt.applyIf(data,this.data);},});",
      "entityLists": [`${Config.MZDB.YEARMAKEMODEL}@${Config.NAMESPACE}`],
      "priority": 0
    }
  }
}