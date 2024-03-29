$(function(){
  window.Todo = Backbone.Model.extend({
    defaults: function(){
      return {
        done: false,
        order: Todos.nextOrder()
      }
    },
    
    toggle: function() {
      this.save({done: !this.get("done")});
    }
  });
  
  window.TodoList = Backbone.Collection.extend({
    model: Todo,
    localStorage: new Store("todos"),
    
    done: function(){
      return this.filter(function(todo){ return todo.get("done"); });
    },
    
    remaining: function(){
      return this.without.apply(this, this.done());
    },
    
    nextOrder: function(){
      if(!this.length) return 1;
      return this.last().get("order") + 1;
    },
    
    comparator: function(todo){
      return todo.get("order");
    },
    
    reorder: function(cids){
      _.each(cids, function(cid, index){
        this.get(cid).save({order: index});
      }, this);
    }
  });

  window.Todos = new TodoList;
  
  window.TodoView = Backbone.View.extend({
    tagName: "li",
    
    template: _.template($("#item-template").html()),
    
    events: {
      "click .check"               : "toggleDone",
      "dblclick .todo-text"        : "edit",
      "click a.destroy"            : "clear",
      "keypress .todo-input"       : "updateOnEnter"
    },
    
    initialize: function(){
      this.model.bind("change", this.render, this);
      this.model.bind("destroy", this.remove, this);
    },
    
    render: function(){
      $(this.el).attr("data-cid", this.model.id).html(this.template(this.model.toJSON()));
      this.setText();
      return this;
    },
    
    setText: function(){
      var text = this.model.get("text");
      this.$(".todo-text").text(text);
      this.input = this.$(".todo-input");
      this.input.bind("blur", _.bind(this.close, this)).val(text);
    },
    
    toggleDone: function(){
      this.model.toggle();
    },
    
    edit: function(){
      $(this.el).addClass("editing");
      this.input.focus();
    },
    
    close: function(){ 
      this.model.save({text: this.input.val()});
      $(this.el).removeClass("editing");
    },
    
    updateOnEnter: function(e){
      if(e.keyCode == 13) {
        this.close();
        return false;
      }
    },
    
    remove: function(){
      $(this.el).remove();
    },
    
    clear: function(){
      this.model.destroy();
    }
  });
  
  window.AppView = Backbone.View.extend({
    el: $("#todoapp"),
    
    statsTemplate: _.template($("#stats-template").html()),
    
    events: {
      "keypress #new-todo":       "createOnEnter",
      "keyup #new-todo":          "showTooltip",
      "click .todo-clear a":      "clearCompleted",
      "sortupdate ul#todo-list" : "sortUpdate"
    },
    
    sortUpdate: function(e, ui){
      var items = $(ui.item).siblings().andSelf(),
          cids  = _.map(items, function(e){ return $(e).data('cid') });
      Todos.reorder(cids);
    },
    
    initialize: function(){
      this.input = this.$("#new-todo");
      Todos.bind("add",   this.addOne, this);
      Todos.bind("reset", this.addAll, this);
      Todos.bind("all",   this.render, this);
      
      Todos.fetch();
    },
    
    render: function(){
      this.$("#todo-stats").html(this.statsTemplate({
        total:     Todos.length,
        done:      Todos.done().length,
        remaining: Todos.remaining().length
      }));

      this.$("ul#todo-list").sortable();
    },
    
    addOne: function(todo){
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },
    
    addAll: function(){
      Todos.each(this.addOne);
    },
    
    createOnEnter: function(e){
      var text = this.input.val();
      if(!text || e.keyCode !== 13) return;
      Todos.create({text: text});
      this.input.val("");
    },
    
    clearCompleted: function(e){
      _.each(Todos.done(), function(todo){ todo.destroy(); });
      return false;
    },
    
    showTooltip: function(e){
      var tooltip = this.$(".ui-tooltip-top");
      var val = this.input.val();
      tooltip.fadeOut();
      if(this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      if(val === "" || val === this.input.attr("placeholder")) return;
      var show = function(){ tooltip.show().fadeInt(); };
      this.tooltipTimeout = _.delay(show, 1000);
    }
  });
  
  window.App = new AppView;
});