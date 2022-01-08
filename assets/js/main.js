const host = 'http://server.vippo.ru/api';

const app = new Vue({
    el: '#app',
    data: {
        page: 'index',
        toasts: [],
        loginForm: {
            login: 'admin1',
            password: 'admin1'
        },
        user: {
            token: localStorage.token,
        },
        col: '2',
        bookingForm: {
            arr_date: "2022-01-28",
            dep_date: "2022-02-04",
            room_category_id: null,
            email: null,
            phone: null,
            city: null,
            guests: []
        },
        categories: [],
        sum: [],
        free: [],
        oneCategory: null,
        oneBooking: null,
        codeSearch: "mqwBrk8", //Код для поиска
        allBookings: [],
        allUsers: [],
        allPrices: [],
        addManagerForm: {
            name: 'test_name',
            surname: 'test+surname',
            patronymic: 'test_patronymic',
            login: 'test_login',
            password: 'test_password',
            photo_file: 'null',
        },
    },
    mounted() {
        document.body.className = 'home';
        this.getAllCategories();
    },
    watch: {
        page: function () {
            if (this.page === 'index') {
                document.body.className = 'home';
            } else {
                document.body.className = '';
            }
        },
    },
    computed: {
        isButtonDisabled: function () {
            return (!this.user);
        }
    },
    methods: {
        openPage(pageName) {
            this.page = pageName;
        },
        showToast(text, classes, duration = 3000) {
            const toast = {text, classes, id: Math.random()};
            this.toasts.push(toast);
            setTimeout(() => {
                this.toasts.splice(this.toasts.indexOf(toast), 1);
            }, duration);
        },
        errorToast(data) {
            for (let er in data.error.errors) {
                this.showToast(data.error.errors[er], ['alert-danger']);
            }
        },
        login() {
            fetch(host + '/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.loginForm),
            })
                .then(res => {
                    if (res.ok)
                        this.showToast('Вы вошли', ['alert-success']);
                    else
                        this.showToast('Неверный логин или пароль', ['alert-danger']);
                    return res.json();
                })
                .then(data => {
                    this.user = {
                        "token": data.data.user_token
                    };
                    localStorage.setItem('token', this.user.token);
                    this.pageManager();
                    this.openPage('manager');
                })
        },
        logout() {
            this.user = null;
            localStorage.removeItem('token');
            this.openPage('login');
        },
        pageBooking() {
            if (this.bookingForm.arr_date == null || this.bookingForm.dep_date == null || this.col == null) {
                this.showToast('Заполните все поля', ['alert-danger']);
            } else {
                if ((new Date(this.bookingForm.dep_date) > new Date(this.bookingForm.arr_date)) && new Date(this.bookingForm.arr_date) >= Date.now()) {
                    for (let i = 0; i < Number(this.col); i++) {
                        this.bookingForm.guests[i] = {
                            "name": null,
                            "surname": null,
                            "patronymic": null,
                            "gender": "м",
                            "document_type_id": 1,
                            "document_number": null
                        };
                    }
                    this.calculation();
                    this.openPage('addBooking');
                } else {
                    this.showToast('Введите корректные даты', ['alert-danger']);
                }
            }
        },
        getAllCategories() {
            fetch(host + '/category')
                .then(res => res.json())
                .then(data => {
                    this.categories = data;
                });
        },
        //Расчет цены проживания и свободных номеров
        calculation() {
            app.categories.data.forEach(function (cat) {
                var myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                var raw = JSON.stringify({
                    "arr_date": app.bookingForm.arr_date,
                    "dep_date": app.bookingForm.dep_date,
                    "room_category_id": cat.id,
                });
                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow'
                };
                fetch(host + "/calculation", requestOptions)
                    .then(res => res.json())
                    .then(data => {
                        app.sum[cat.id] = data.data.reduce(function (sum, elem) { //Сумма по всем дням
                            return sum + elem.value;
                        }, 0);
                        app.free[cat.id] = data.data.reduce(function (prev, elem) { //Минимальное значение available_rooms по дням
                            return (prev.available_rooms < elem.available_rooms) ? prev.available_rooms : elem.available_rooms;
                        });
                    });
            });
        },
        readCategory(id) {
            fetch(host + '/category/' + id)
                .then(res => res.json())
                .then(data => {
                    this.oneCategory = data.data;
                    this.openPage('category')
                });
        },
        addBooking() {
            fetch(host + '/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.bookingForm),
            })
                .then(res => {
                    if (res.ok)
                        this.showToast('Заявка принята', ['alert-success']);
                    return res.json();
                })
                .then(data => {
                    if (data.error) {
                        this.errorToast(data);
                    } else {
                        this.readBooking(data.data.code);
                    }
                })
        },
        readBooking(code) {
            fetch(host + '/booking/' + code)
                .then(res => res.json())
                .then(data => {
                    this.oneBooking = data;
                    this.openPage('booking');
                });


        },
        pageManager() {
            fetch(host + '/booking', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.user.token}`
                },
            })
                .then(res => res.json())
                .then(data => {
                    this.allBookings = data;
                });
            fetch(host + '/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.user.token}`
                },
            })
                .then(res => res.json())
                .then(data => {
                    this.allUsers = data;
                });
            fetch(host + '/price', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.user.token}`
                },
            })
                .then(res => res.json())
                .then(data => {
                    this.allPrices = data;
                });
            this.openPage('manager');
        },
        editBooking(booking_id) {
            fetch(host + '/booking/' + booking_id, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.user.token}`,
                },
                body: JSON.stringify(
                    {
                        "booking_status_id": this.oneBooking.data.status,
                    }
                ),
            })
                .then(res => {
                    if (res.ok)
                        this.showToast('Изменения внесены', ['alert-success']);
                    else
                        this.showToast('Что-то пошло не так', ['alert-danger']);
                    return res.json();
                })
                .then(data => {
                    this.pageManager();
                })
        },
        toDismiss(user_id) {
            fetch(host + '/user/' + user_id+'/to-dismiss', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.user.token}`,
                },
            })
                .then(res => {
                    if (res.ok)
                        this.showToast('Менеджер уволен', ['alert-success']);
                    else
                        this.showToast('Что-то пошло не так', ['alert-danger']);
                    return res.json();
                })
                .then(data => {
                    this.pageManager();
                })

        },
        fileSelected() {
            if (event.target.files.length)
                this.addManagerForm.photo_file = event.target.files[0];
        },
        addUser() {
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", `Bearer ${this.user.token}`);

            var formData = new FormData();
            formData.append('name', this.addManagerForm.name);
            formData.append('surname', this.addManagerForm.surname);
            formData.append('patronymic', this.addManagerForm.patronymic);
            formData.append('login', this.addManagerForm.login);
            formData.append('password', this.addManagerForm.password);
            formData.append('photo_file', this.addManagerForm.photo_file);

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: formData,
                redirect: 'follow'
            };

            fetch(host + "/user", requestOptions)
                .then(response => response.json())
                .then(result => {
                    if (result.error.code) {
                        this.errorToast(result);
                    } else {
                        this.openPage('manager');
                    }
                })



        }



    },
});