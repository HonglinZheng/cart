const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    fetch(`${URL}/cart/${id}`)
      .then((res) => res.json()) // use then() to wait fetch to complete and to return a new promise
      .then(item => {
        const updatedItem = { ...item, count: newAmount };
        return fetch(`${URL}/cart/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedItem),
        });
      })
  };

  const deleteFromCart = (id) => {
    fetch(`${URL}/cart/${id}`, { method: "DELETE" }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };


  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  const inventorylistEl = document.querySelector(".inventorylist");
  const cartlistEl = document.querySelector(".cartlist");
  const itemCounts = {};
  const itemContents = {};

  const renderCart = (cart) => {
    let cartTemp = "";
    cart.forEach((item) => {
      const content = item.content;
      const liTemp = `<li id=${item.id}>
   <span>${content} * ${item.count}</span>
    <button class="cart__delete-btn">delete</button>
    </li>`;
      cartTemp += liTemp;
    });
    cartlistEl.innerHTML = cartTemp;
  };

  const renderInventory = (inventory) => {
    let Temp = "";
    inventory.forEach((item) => {
      itemCounts[item.id] = itemCounts[item.id] || 0;
      itemContents[item.id] = item.content;
      const count = itemCounts[item.id];
      const content = item.content;
      const liTemp = `<li id=${item.id}>
   <span>${content}</span>
   <button class="inventory__minus-btn">-</button>
   <span>${count}</span>
    <button class="inventory__plus-btn">+</button>
    <button class="inventory__addToCart-btn">add to cart</button>
    </li>`;
      Temp += liTemp;
    });
    inventorylistEl.innerHTML = Temp;
  };
  return {
    renderInventory, renderCart, inventorylistEl, cartlistEl, itemCounts, itemContents,
  };
})();

const Controller = ((model, view) => {
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => {
      state.inventory = data;
    });
    model.getCart().then((data) => {
      state.cart = data;
    });
  };

  const handleUpdateAmount = () => {
    view.inventorylistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "inventory__minus-btn") {
        const id = element.parentElement.getAttribute("id");
        if (view.itemCounts[id] > 0)
          view.itemCounts[id]--;
      } else if (element.className === "inventory__plus-btn") {
        const id = element.parentElement.getAttribute("id");
        view.itemCounts[id]++;
      }
      view.renderInventory(state.inventory);
    });

  };

  const handleAddToCart = () => {
    view.inventorylistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "inventory__addToCart-btn") {
        const currentID = Number(element.parentElement.getAttribute("id"));
        const addCount = view.itemCounts[currentID];
        let currentCount;
        model.getCart().then(cartData => {
          const presentItem = cartData.find(item => item.id === currentID);
          if (presentItem) {// the item is present in cart; need update
            currentCount = presentItem.count;
            model.updateCart(currentID, currentCount + addCount);
          } else {// the item is not in cart; need add
            const newItem = {
              content: view.itemContents[currentID],
              id: currentID,
              count: addCount
            };
            model.addToCart(newItem);
          }
        })

        setTimeout(() => {
          model.getCart().then((data) => {
            state.cart = data;
          })
        }, 300)
      }
    });

  };

  const handleDelete = () => {
    view.cartlistEl.addEventListener("click", (event) => {
      const element = event.target;
      if (element.className === "cart__delete-btn") {
        const id = element.parentElement.getAttribute("id");
        model.deleteFromCart(id);
        setTimeout(() => {
          model.getCart().then((data) => {
            state.cart = data;
          })
        }, 300);
      }
    })
  };

  const handleCheckout = () => {
    document.querySelectorAll('.checkout-btn').forEach(button => {
      button.addEventListener('click', function () {
        model.checkout()
        setTimeout(() => {
          model.getCart().then((data) => {
            state.cart = data;
          })
        }, 300);
      })
    })
  };
  const bootstrap = () => {
    init();
    state.subscribe(() => {
      console.log("SUBSCRIBING...");
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
    handleCheckout();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();

/*
(1) store inventory number locally
(2) API module only responsible for making API only, don't put too much logic(controller or somewhere else)
(3) View only responsible for generating HTML
(4) Controller only reacts to user interaction
(5) model is where you store the state and its the single source of the truth
(6) In controller don't add UI to the HTML directly; update state first; let state do UI
(7) DEcoupling centralize the logic 
*/
