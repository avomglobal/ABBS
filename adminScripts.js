/* ==========================================
   ABBS SIS - ADMIN SCRIPTS
   ========================================== */

// Base Web App API URL when hosted on GitHub Pages
const APPS_SCRIPT_API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

window.onload = function () {
    refreshDashboard();
};

/* ==========================================
   DASHBOARD
   ========================================== */

function refreshDashboard() {
    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(showDashboard)
            .withFailureHandler(showError)
            .getDashboardStats();
    } else {
        // Fallback fetch API for GitHub Pages hosting
        callApi('getDashboardStats')
            .then(showDashboard)
            .catch(showError);
    }
}

function showDashboard(data) {
    if (!data) return;

    if (document.getElementById("students"))
        document.getElementById("students").innerHTML = data.students || 0;

    if (document.getElementById("programmes"))
        document.getElementById("programmes").innerHTML = data.programmes || 0;

    if (document.getElementById("courses"))
        document.getElementById("courses").innerHTML = data.courses || 0;

    if (document.getElementById("enrolments"))
        document.getElementById("enrolments").innerHTML = data.enrolments || 0;

    if (document.getElementById("certificates"))
        document.getElementById("certificates").innerHTML = data.certificates || 0;

    if (document.getElementById("pending"))
        document.getElementById("pending").innerHTML = data.pendingCertificates || 0;
}

/* ==========================================
   PAGE LOADER
   ========================================== */

function loadPage(page, callback) {
    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(function (html) {
                document.getElementById("mainContent").innerHTML = html;
                handlePageCallbacks(page, callback);
            })
            .withFailureHandler(showError)
            .loadAdminPage(page);
    } else {
        // Dynamic fetch for GitHub Pages (HTML pages saved as lowercase filename)
        const fileName = page.toLowerCase() + '.html';
        fetch(fileName)
            .then(res => {
                if (!res.ok) throw new Error(`Could not load ${fileName}`);
                return res.text();
            })
            .then(html => {
                document.getElementById("mainContent").innerHTML = html;
                handlePageCallbacks(page, callback);
            })
            .catch(showError);
    }
}

function handlePageCallbacks(page, callback) {
    const pageLower = page.toLowerCase();

    if (pageLower === "dashboard") {
        refreshDashboard();
    } else if (pageLower === "students") {
        setTimeout(loadStudentList, 150);
    } else if (pageLower === "academicsessions" || pageLower === "academic_sessions") {
        setTimeout(loadAcademicSessionsList, 150);
    } else if (pageLower === "courses") {
        setTimeout(loadCourseList, 150);
    } else if (pageLower === "enrolments") {
        setTimeout(loadEnrolmentsPageData, 150);
    } else if (pageLower === "certificates") {
        setTimeout(loadCertificateTables, 150);
    } else if (pageLower === "assessments") {
        setTimeout(initAssessmentPage, 150);
    } else if (pageLower === 'reports') {
        initReportsPage();
    } else if (pageLower === "programmes") {
        setTimeout(loadProgrammeList, 150);
    }

    if (typeof callback === "function") {
        callback();
    }
}

/* ==========================================
   STUDENT MODULE
   ========================================== */

function showStudentForm() {
    loadSubPage("studentForm", "studentContent");
}

function showStudentList() {
    loadSubPage("studentList", "studentContent", function () {
        setTimeout(loadStudentList, 300);
    });
}

function loadSubPage(pageName, targetContainerId, callback) {
    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(function (html) {
                document.getElementById(targetContainerId).innerHTML = html;
                if (callback) callback();
            })
            .loadAdminPage(pageName);
    } else {
        fetch(pageName.toLowerCase() + '.html')
            .then(res => res.text())
            .then(html => {
                document.getElementById(targetContainerId).innerHTML = html;
                if (callback) callback();
            })
            .catch(showError);
    }
}

/* ==========================================
   SAVE STUDENT
   ========================================== */

function saveStudent() {
    const studentDTO = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        otherName: document.getElementById("otherName").value.trim(),
        gender: document.getElementById("gender").value,
        dateOfBirth: document.getElementById("dateOfBirth").value,
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        address: document.getElementById("address").value.trim(),
        registeredBy: "Administrator"
    };

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(studentSaved)
            .withFailureHandler(showError)
            .registerStudent(studentDTO);
    } else {
        callApi('registerStudent', studentDTO)
            .then(studentSaved)
            .catch(showError);
    }
}

function studentSaved(response) {
    const msg = document.getElementById("studentMessage");
    if (!msg) return;

    if (response && response.success) {
        msg.className = "message success";
        msg.innerHTML = "✅ " + response.message + "<br><br><strong>Student ID:</strong> " + response.data.studentId;
        clearStudentForm();
        refreshDashboard();
    } else {
        msg.className = "message error";
        msg.innerHTML = "❌ " + (response ? response.message : "Error saving student");
    }
}

function clearStudentForm() {
    const form = document.getElementById("studentForm");
    if (form) form.reset();
}

/* ==========================================
   GENERAL ERROR & API HELPER
   ========================================== */

function showError(error) {
    console.error(error);
    const msg = document.getElementById("studentMessage") || document.getElementById("progStatusMsg") || document.getElementById("sessionStatusMsg");

    if (msg) {
        msg.className = "message error";
        msg.style.color = "red";
        msg.innerHTML = "❌ " + (error.message || error);
    } else {
        alert(error.message || error);
    }
}

async function callApi(action, payload = {}) {
    const response = await fetch(APPS_SCRIPT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
    });
    return await response.json();
}

/* ==========================================
   PROGRAMMES MODULE
   ========================================== */

function loadProgrammeList() {
    const tableBody = document.getElementById("programmeTableBody");
    if (!tableBody) return;

    const handleSuccess = function (response) {
        if (!response || !response.success) {
            tableBody.innerHTML = `<tr><td colspan='7' style='color:red; text-align:center;'>${response ? response.message : 'Error loading data'}</td></tr>`;
            return;
        }

        const programmes = response.data || [];
        if (programmes.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No programmes found.</td></tr>";
            return;
        }

        window.currentProgrammes = programmes;
        let html = "";
        programmes.forEach(function (p, index) {
            const id = p[0] || '';
            const name = p[1] || '';
            const code = p[2] || '';
            const category = p[3] || '';
            const duration = p[4] || '';
            const status = p[6] || 'Active';

            const isInactive = status === 'Inactive';
            const toggleBtnLabel = isInactive ? 'Enable' : 'Disable';
            const toggleBtnClass = isInactive ? 'btn-success' : 'btn-secondary';

            html += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;"><strong>${id}</strong></td>
                <td style="padding: 10px;">${name}</td>
                <td style="padding: 10px;">${code}</td>
                <td style="padding: 10px;">${category}</td>
                <td style="padding: 10px;">${duration}</td>
                <td style="padding: 10px;">
                  <span style="padding: 3px 8px; border-radius: 12px; font-size: 12px; background: ${isInactive ? '#ffebee; color:#c62828;' : '#e8f5e9; color:#2e7d32;'}">
                    ${status}
                  </span>
                </td>
                <td style="padding: 10px;">
                  <button type="button" class="btn btn-primary" onclick="editProgramme(${index})" style="padding:4px 8px; margin-right:4px;">Edit</button>
                  <button type="button" class="btn ${toggleBtnClass}" onclick="toggleProgramme('${id}', '${status}')" style="padding:4px 8px;">${toggleBtnLabel}</button>
                </td>
              </tr>
            `;
        });
        tableBody.innerHTML = html;
    };

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run.withSuccessHandler(handleSuccess).getProgrammes();
    } else {
        callApi('getProgrammes').then(handleSuccess).catch(showError);
    }
}

function editProgramme(index) {
    const p = window.currentProgrammes[index];
    if (!p) return;

    document.getElementById('progId').value = p[0];
    document.getElementById('progName').value = p[1];
    document.getElementById('progCode').value = p[2];
    document.getElementById('progCategory').value = p[3];
    document.getElementById('progDuration').value = p[4];
    document.getElementById('progStatus').value = p[6] || 'Active';

    document.getElementById('btnSaveProgramme').textContent = 'Update Programme';
    document.getElementById('progStatusMsg').textContent = 'Editing ' + p[0];
    document.getElementById('progStatusMsg').style.color = '#333';
}

function handleProgrammeSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveProgramme');
    const msg = document.getElementById('progStatusMsg');

    btn.disabled = true;
    msg.textContent = 'Saving...';

    const progId = document.getElementById('progId').value;
    const payload = {
        programmeId: progId,
        programmeName: document.getElementById('progName').value,
        programmeCode: document.getElementById('progCode').value,
        category: document.getElementById('progCategory').value,
        duration: document.getElementById('progDuration').value,
        status: document.getElementById('progStatus').value
    };

    const serverFunction = progId ? 'updateProgramme' : 'createProgramme';

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(function (res) {
                btn.disabled = false;
                if (res.success) {
                    msg.style.color = 'green';
                    msg.textContent = res.message;
                    resetProgrammeForm();
                    loadProgrammeList();
                } else {
                    msg.style.color = 'red';
                    msg.textContent = res.message;
                }
            })
            .withFailureHandler(function (err) {
                btn.disabled = false;
                msg.style.color = 'red';
                msg.textContent = 'Error: ' + err.message;
            })[serverFunction](payload);
    } else {
        callApi(serverFunction, payload)
            .then(res => {
                btn.disabled = false;
                if (res.success) {
                    msg.style.color = 'green';
                    msg.textContent = res.message;
                    resetProgrammeForm();
                    loadProgrammeList();
                } else {
                    msg.style.color = 'red';
                    msg.textContent = res.message;
                }
            })
            .catch(err => {
                btn.disabled = false;
                showError(err);
            });
    }
}

function resetProgrammeForm() {
    document.getElementById('programmeForm').reset();
    document.getElementById('progId').value = '';
    document.getElementById('btnSaveProgramme').textContent = 'Save Programme';
}

function toggleProgramme(id, status) {
    if (!confirm(`Are you sure you want to ${status === 'Active' ? 'disable' : 'enable'} ${id}?`)) return;

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(function (res) {
                if (res.success) loadProgrammeList();
                else alert("Failed to update status: " + res.message);
            })
            .toggleProgrammeStatus(id, status);
    } else {
        callApi('toggleProgrammeStatus', { id, status }).then(res => {
            if (res.success) loadProgrammeList();
            else alert("Failed to update status: " + res.message);
        });
    }
}

/* ==========================================
   ACADEMIC SESSIONS MODULE
   ========================================== */

function loadAcademicSessionsList() {
    const tableBody = document.getElementById("sessionTableBody");
    if (!tableBody) return;

    const handleSuccess = function (response) {
        if (!response || !response.success) {
            tableBody.innerHTML = `<tr><td colspan='6' style='color:red; text-align:center;'>${response ? response.message : 'Error loading sessions'}</td></tr>`;
            return;
        }

        const sessions = response.data || [];
        if (sessions.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No academic sessions found.</td></tr>";
            return;
        }

        window.currentSessions = sessions;
        let html = "";
        sessions.forEach(function (s, index) {
            const id = s[0] || '';
            const name = s[1] || '';
            const start = s[2] || '';
            const end = s[3] || '';
            const status = s[4] || 'Active';

            const isInactive = status === 'Inactive';
            const toggleLabel = isInactive ? 'Enable' : 'Disable';
            const toggleClass = isInactive ? 'btn-success' : 'btn-secondary';

            html += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;"><strong>${id}</strong></td>
                <td style="padding: 10px;">${name}</td>
                <td style="padding: 10px;">${start}</td>
                <td style="padding: 10px;">${end}</td>
                <td style="padding: 10px;">
                  <span style="padding: 3px 8px; border-radius: 12px; font-size: 12px; background: ${isInactive ? '#ffebee; color:#c62828;' : '#e8f5e9; color:#2e7d32;'}">
                    ${status}
                  </span>
                </td>
                <td style="padding: 10px;">
                  <button type="button" class="btn btn-primary" onclick="editAcademicSession(${index})" style="padding:4px 8px; margin-right:4px;">Edit</button>
                  <button type="button" class="btn ${toggleClass}" onclick="toggleAcademicSession('${id}', '${status}')" style="padding:4px 8px;">${toggleLabel}</button>
                </td>
              </tr>
            `;
        });
        tableBody.innerHTML = html;
    };

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run.withSuccessHandler(handleSuccess).getAcademicSessions();
    } else {
        callApi('getAcademicSessions').then(handleSuccess).catch(showError);
    }
}

function editAcademicSession(index) {
    const s = window.currentSessions[index];
    if (!s) return;

    document.getElementById('sessionId').value = s[0];
    document.getElementById('sessionName').value = s[1];
    document.getElementById('startYear').value = s[2];
    document.getElementById('endYear').value = s[3];
    document.getElementById('sessionStatus').value = s[4] || 'Active';

    document.getElementById('sessionFormTitle').textContent = 'Edit Academic Session (' + s[0] + ')';
    document.getElementById('btnSaveSession').textContent = 'Update Session';
}

function handleAcademicSessionSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveSession');
    const msg = document.getElementById('sessionStatusMsg');

    btn.disabled = true;
    msg.style.color = '#333';
    msg.textContent = 'Saving...';

    const sessionId = document.getElementById('sessionId').value;
    const payload = {
        sessionId: sessionId,
        sessionName: document.getElementById('sessionName').value,
        startYear: document.getElementById('startYear').value,
        endYear: document.getElementById('endYear').value,
        status: document.getElementById('sessionStatus').value
    };

    const serverFunc = sessionId ? 'updateAcademicSession' : 'createAcademicSession';

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(function (res) {
                btn.disabled = false;
                if (res.success) {
                    msg.style.color = 'green';
                    msg.textContent = res.message;
                    resetAcademicSessionForm();
                    loadAcademicSessionsList();
                } else {
                    msg.style.color = 'red';
                    msg.textContent = res.message;
                }
            })
            .withFailureHandler(function (err) {
                btn.disabled = false;
                msg.style.color = 'red';
                msg.textContent = 'Error: ' + err.message;
            })[serverFunc](payload);
    } else {
        callApi(serverFunc, payload)
            .then(res => {
                btn.disabled = false;
                if (res.success) {
                    msg.style.color = 'green';
                    msg.textContent = res.message;
                    resetAcademicSessionForm();
                    loadAcademicSessionsList();
                } else {
                    msg.style.color = 'red';
                    msg.textContent = res.message;
                }
            })
            .catch(err => {
                btn.disabled = false;
                showError(err);
            });
    }
}

function resetAcademicSessionForm() {
    document.getElementById('academicSessionForm').reset();
    document.getElementById('sessionId').value = '';
    document.getElementById('sessionFormTitle').textContent = 'New Academic Session';
    document.getElementById('btnSaveSession').textContent = 'Save Session';
}

function toggleAcademicSession(id, status) {
    if (!confirm(`Are you sure you want to ${status === 'Active' ? 'disable' : 'enable'} session ${id}?`)) return;

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(function (res) {
                if (res.success) loadAcademicSessionsList();
                else alert("Error: " + res.message);
            })
            .toggleAcademicSessionStatus(id, status);
    } else {
        callApi('toggleAcademicSessionStatus', { id, status }).then(res => {
            if (res.success) loadAcademicSessionsList();
            else alert("Error: " + res.message);
        });
    }
}

/* ==========================================
   STUDENT LIST MODULE
   ========================================== */

function loadStudentList() {
    const tableBody = document.getElementById("studentTableBody");
    if (!tableBody) return;

    const handleSuccess = function (response) {
        if (!response || !response.success) {
            tableBody.innerHTML = `<tr><td colspan='7' style='color:red; text-align:center;'>${response ? response.message : 'Error loading students'}</td></tr>`;
            return;
        }

        const students = response.data || [];
        if (students.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>No students registered yet.</td></tr>";
            return;
        }

        window.currentStudents = students;
        let html = "";
        students.forEach(function (s, index) {
            const id = s[0] || '';
            const fullName = `${s[1] || ''} ${s[2] || ''} ${s[3] || ''}`.trim();
            const gender = s[4] || '';
            const phone = s[6] || '';
            const email = s[7] || '';
            const status = s[10] || 'Active';

            const isInactive = status === 'Inactive';
            const toggleLabel = isInactive ? 'Enable' : 'Disable';
            const toggleClass = isInactive ? 'btn-success' : 'btn-secondary';

            html += `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;"><strong>${id}</strong></td>
                <td style="padding: 10px;">${fullName}</td>
                <td style="padding: 10px;">${gender}</td>
                <td style="padding: 10px;">${phone}</td>
                <td style="padding: 10px;">${email}</td>
                <td style="padding: 10px;">
                  <span style="padding: 3px 8px; border-radius: 12px; font-size: 12px; background: ${isInactive ? '#ffebee; color:#c62828;' : '#e8f5e9; color:#2e7d32;'}">
                    ${status}
                  </span>
                </td>
                <td style="padding: 10px;">
                  <button type="button" class="btn btn-primary" onclick="editStudent(${index})" style="padding:4px 8px; margin-right:4px;">Edit</button>
                  <button type="button" class="btn ${toggleClass}" onclick="toggleStudent('${id}', '${status}')" style="padding:4px 8px;">${toggleLabel}</button>
                </td>
              </tr>
            `;
        });
        tableBody.innerHTML = html;
    };

    if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run.withSuccessHandler(handleSuccess).getStudents();
    } else {
        callApi('getStudents').then(handleSuccess).catch(showError);
    }
}
