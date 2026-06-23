(function () {
    const reportConfigs = {
        material: {
            title: "Material Search/Escort (Monthly)",
            subtitle: "Monthly report prototype based on SecurePass and Go models and PSJoshuaScript.sql.",
            dataPath: "data/material-search-escort.json",
            columns: [
                ["date", "Date"],
                ["escortStaff", "Escort Staff"],
                ["typeOfMaterial", "Type of Material"],
                ["quantityWeight", "Quantity/Weight"],
                ["searchTime", "Search Time"],
                ["escortTime", "Escort Time"],
                ["source", "Source"],
                ["destinationDisposal", "Destination/Disposal"],
                ["remarks", "Remarks"],
                ["zonalOfficerComment", "Zonal Officer Comment"],
                ["period", "Period"],
                ["shiftDate", "Shift Date"]
            ],
            summary: [
                {
                    key: "totalExercises",
                    label: "Total Exercises",
                    compute: records => records.length
                },
                {
                    key: "noComplaintCases",
                    label: "No Complaint Cases",
                    compute: records => records.filter(r => containsNoComplaint(r.remarks)).length
                },
                {
                    key: "escortsClosed",
                    label: "Escorts Closed",
                    compute: records => records.filter(r => r.isClosed).length
                },
                {
                    key: "outstandingRemarks",
                    label: "Outstanding Remarks",
                    compute: records => records.filter(r => r.outstanding).length
                }
            ]
        },
        cbn: {
            title: "CBN Evacuation (Monthly)",
            subtitle: "CBN evacuation monthly report structure from SecurePass views/forms and SQL schema.",
            dataPath: "data/cbn-evacuation.json",
            columns: [
                ["dateOfEvacuation", "Date of Evacuation"],
                ["nameTallyNo", "Name/Tally No"],
                ["cbnStaffName", "CBN Staff Name"],
                ["teamLeader", "Team Leader"],
                ["denominationDetails", "Denomination Details"],
                ["truckDetail", "Truck Detail"],
                ["observations", "Observations"],
                ["dutyOfficerComment", "Duty Officer Comment"],
                ["period", "Period"],
                ["shiftDate", "Shift Date"]
            ],
            summary: [
                {
                    key: "totalEvacuations",
                    label: "Total Evacuations",
                    compute: records => records.length
                },
                {
                    key: "truckBatches",
                    label: "Truck Batches",
                    compute: records => records.reduce((sum, r) => sum + (Number(r.truckBatchCount) || 0), 0)
                },
                {
                    key: "reviewedByDutyOfficer",
                    label: "Reviewed by Duty Officer",
                    compute: records => records.filter(r => !!r.dutyOfficerComment && r.dutyOfficerComment.trim().length > 0).length
                },
                {
                    key: "pendingReview",
                    label: "Pending Review",
                    compute: records => records.filter(r => !r.reviewComplete).length
                }
            ]
        },
        security: {
            title: "Security Documents (Monthly)",
            subtitle: "Security document escort monthly report from SecurePass form and SQL schema.",
            dataPath: "data/security-documents.json",
            columns: [
                ["date", "Date"],
                ["typeOfDocument", "Type of Document"],
                ["customer", "Customer"],
                ["commencementPoint", "Commencement Point"],
                ["escortTime", "Escort Time"],
                ["destination", "Destination"],
                ["completionTime", "Completion Time"],
                ["vehicleReg", "Vehicle Reg"],
                ["driver", "Driver"],
                ["securityEscort", "Security Escort"],
                ["remarks", "Remarks"],
                ["dutyOfficerRemark", "Duty Officer Remark"],
                ["period", "Period"]
            ],
            summary: [
                {
                    key: "totalEscorts",
                    label: "Total Escorts",
                    compute: records => records.length
                },
                {
                    key: "customersServed",
                    label: "Customers Served",
                    compute: records => new Set(records.map(r => r.customer).filter(Boolean)).size
                },
                {
                    key: "completedOnTime",
                    label: "Completed On Time",
                    compute: records => records.filter(r => r.completedOnTime).length
                },
                {
                    key: "dutyOfficerRemarksLogged",
                    label: "Duty Officer Remarks Logged",
                    compute: records => records.filter(r => !!r.dutyOfficerRemark && r.dutyOfficerRemark.trim().length > 0).length
                }
            ]
        }
    };

    function containsNoComplaint(value) {
        return typeof value === "string" && value.toLowerCase().includes("no complaint");
    }

    function getMonth(isoDate) {
        if (!isoDate || typeof isoDate !== "string" || isoDate.length < 7) {
            return "";
        }

        return isoDate.slice(0, 7);
    }

    function createHeader(activeReportKey, config) {
        const links = [
            { key: "material", href: "material-search-escort.html", label: "1. Material Search/Escort" },
            { key: "cbn", href: "cbn-evacuation.html", label: "2. CBN Evacuation" },
            { key: "security", href: "security-documents.html", label: "3. Security Documents" }
        ];

        const nav = links
            .map(l => `<a href="${l.href}" class="${l.key === activeReportKey ? "active" : ""}">${l.label}</a>`)
            .join("");

        return `
            <div class="brand">
                <h1>Physical Security Reporting Sample</h1>
                <p>${config.subtitle}</p>
            </div>
            <nav class="header-links">${nav}</nav>
        `;
    }

    function renderSummary(config, records) {
        const holder = document.getElementById("summaryCards");
        if (!holder) {
            return;
        }

        holder.innerHTML = config.summary
            .map(card => {
                const value = card.compute(records);
                return `<div class="card"><div class="label">${card.label}</div><div class="value">${value}</div></div>`;
            })
            .join("");
    }

    function renderTableHeader(config) {
        const tableHead = document.getElementById("reportHead");
        if (!tableHead) {
            return;
        }

        const headers = config.columns.map(c => `<th>${c[1]}</th>`).join("");
        tableHead.innerHTML = `<tr>${headers}</tr>`;
    }

    function renderRows(config, records) {
        const body = document.getElementById("reportBody");
        const empty = document.getElementById("emptyState");

        if (!body || !empty) {
            return;
        }

        if (records.length === 0) {
            body.innerHTML = "";
            empty.hidden = false;
            return;
        }

        empty.hidden = true;
        body.innerHTML = records
            .map(record => {
                const cells = config.columns
                    .map(col => `<td>${record[col[0]] ?? ""}</td>`)
                    .join("");
                return `<tr>${cells}</tr>`;
            })
            .join("");
    }

    function init() {
        const root = document.body;
        const reportType = root.getAttribute("data-report-type");
        const config = reportConfigs[reportType];

        if (!config) {
            return;
        }

        const header = document.getElementById("reportHeader");
        const title = document.getElementById("reportTitle");
        const monthInput = document.getElementById("monthFilter");
        const locationInput = document.getElementById("locationFilter");
        const periodInput = document.getElementById("periodFilter");

        if (header) {
            header.innerHTML = createHeader(reportType, config);
        }

        if (title) {
            title.textContent = config.title;
        }

        renderTableHeader(config);

        fetch(config.dataPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load report data");
                }

                return response.json();
            })
            .then(data => {
                const records = Array.isArray(data) ? data : [];

                function applyFilters() {
                    const selectedMonth = monthInput ? monthInput.value : "";
                    const selectedLocation = locationInput ? locationInput.value : "";
                    const selectedPeriod = periodInput ? periodInput.value : "";

                    const filtered = records.filter(record => {
                        const rowMonth = getMonth(record.shiftDate || record.date || record.dateOfEvacuation);
                        const monthOk = !selectedMonth || selectedMonth === rowMonth;
                        const locationOk = !selectedLocation || selectedLocation === record.location;
                        const periodOk = !selectedPeriod || selectedPeriod === record.period;

                        return monthOk && locationOk && periodOk;
                    });

                    renderSummary(config, filtered);
                    renderRows(config, filtered);
                }

                [monthInput, locationInput, periodInput].forEach(el => {
                    if (el) {
                        el.addEventListener("change", applyFilters);
                    }
                });

                applyFilters();
            })
            .catch(() => {
                const empty = document.getElementById("emptyState");
                if (empty) {
                    empty.hidden = false;
                    empty.textContent = "Unable to load report data file.";
                }
            });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
