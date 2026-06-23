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
            { key: "dashboard", href: "index.html", label: "Dashboard Home" },
            { key: "material", href: "material-search-escort.html", label: "1. Material Search/Escort" },
            { key: "cbn", href: "cbn-evacuation.html", label: "2. CBN Evacuation" },
            { key: "security", href: "security-documents.html", label: "3. Security Documents" }
        ];

        const nav = links
            .map(l => `<a href="${l.href}" class="${l.key === activeReportKey ? "active" : ""}">${l.label}</a>`)
            .join("");

        return `
            <div class="header-brand">
                <h1 class="header-title">Physical Security Reporting <span>Reports</span></h1>
                <p class="header-subtitle">${config.subtitle}</p>
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
                return `<div class="stat-card"><div class="label">${card.label}</div><div class="value">${value}</div></div>`;
            })
            .join("");
    }

    function renderTableHeader(config) {
        const tableHead = document.getElementById("reportHead");
        if (!tableHead) {
            return;
        }

        const headers = config.columns.map(c => `<th>${c[1]}</th>`).join("");
        tableHead.innerHTML = `<tr>${headers}<th>Actions</th></tr>`;
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
                return `<tr class="clickable" onclick="openModal('${record.id}')">${cells}<td><div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn btn-outline btn-sm" onclick="event.stopPropagation();openModal('${record.id}')">View</button><button class="btn btn-pdf btn-sm" onclick="event.stopPropagation();exportSinglePdf('${record.id}')">PDF</button></div></td></tr>`;
            })
            .join("");
    }

    function toTitleCaseLabel(key) {
        return String(key)
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]+/g, " ")
            .replace(/^./, s => s.toUpperCase())
            .trim();
    }

    function createElementForPdf(html) {
        const div = document.createElement("div");
        div.style.padding = "24px";
        div.style.fontFamily = "Segoe UI, system-ui, sans-serif";
        div.style.background = "#ffffff";
        div.style.color = "#1a2332";
        div.style.maxWidth = "980px";
        div.style.margin = "0 auto";
        div.innerHTML = html;
        return div;
    }

    function generatePdfFromElement(element, filename) {
        if (!window.jspdf || typeof window.html2canvas !== "function") {
            alert("PDF libraries are not loaded on this page.");
            return;
        }

        const { jsPDF } = window.jspdf;
        window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfPageHeight = pdf.internal.pageSize.getHeight();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdfPageHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdfPageHeight;
            }

            pdf.save(filename);
        }).catch(error => {
            console.error(error);
            alert("Could not generate PDF. Please try again.");
        });
    }

    function buildSingleRecordPdfMarkup(config, record) {
        const rows = config.columns
            .map(([field, label]) => `<p style="margin:0 0 8px;"><strong>${label}:</strong> ${record[field] ?? ""}</p>`)
            .join("");

        return `
            <h2 style="margin:0 0 12px;color:#163820;border-bottom:2px solid #1f6f35;padding-bottom:8px;">${config.title} - Entry Detail</h2>
            <p style="margin:0 0 10px;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            ${rows}
        `;
    }

    function buildGroupedMonthlyPdfMarkup(config, records, selectedMonth) {
        const groups = records.reduce((acc, record) => {
            const location = record.location || "Unspecified Location";
            const period = record.period || "Unspecified Period";

            if (!acc[location]) {
                acc[location] = {};
            }

            if (!acc[location][period]) {
                acc[location][period] = [];
            }

            acc[location][period].push(record);
            return acc;
        }, {});

        const locationSections = Object.entries(groups)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([location, periods]) => {
                const periodBlocks = Object.entries(periods)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([period, entries]) => {
                        const rows = entries
                            .map(entry => {
                                const rowCells = config.columns
                                    .map(([field]) => `<td style="padding:7px 10px;border-bottom:1px solid #e8edf3;vertical-align:top;">${entry[field] ?? ""}</td>`)
                                    .join("");
                                return `<tr>${rowCells}</tr>`;
                            })
                            .join("");

                        const head = config.columns
                            .map(([, label]) => `<th style="padding:8px 10px;text-align:left;background:#edf7ee;color:#163820;border-bottom:1px solid #d9e8dd;">${label}</th>`)
                            .join("");

                        return `
                            <div style="margin:12px 0 18px;">
                                <h4 style="margin:0 0 8px;color:#1f6f35;">${period} (${entries.length})</h4>
                                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                                    <thead><tr>${head}</tr></thead>
                                    <tbody>${rows}</tbody>
                                </table>
                            </div>
                        `;
                    })
                    .join("");

                const locationTotal = Object.values(periods).reduce((sum, list) => sum + list.length, 0);

                return `
                    <section style="margin:18px 0 24px;padding:14px;border:1px solid #dce7dd;border-radius:12px;">
                        <h3 style="margin:0 0 8px;color:#163820;">${location} (${locationTotal})</h3>
                        ${periodBlocks}
                    </section>
                `;
            })
            .join("");

        const monthLabel = selectedMonth || "All Months";
        return `
            <h2 style="margin:0 0 12px;color:#163820;border-bottom:2px solid #1f6f35;padding-bottom:8px;">${config.title} - Monthly Grouped Export</h2>
            <p style="margin:0 0 6px;"><strong>Month:</strong> ${monthLabel}</p>
            <p style="margin:0 0 6px;"><strong>Total Entries:</strong> ${records.length}</p>
            <p style="margin:0 0 16px;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            ${locationSections}
        `;
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
        const modalOverlay = document.getElementById("modalOverlay");
        const modalTitle = document.getElementById("modalTitle");
        const modalBody = document.getElementById("modalBody");
        const modalClose = document.getElementById("modalClose");
        const modalCloseBtn = document.getElementById("modalCloseBtn");
        const modalPdfBtn = document.getElementById("modalPdfBtn");
        const exportPdfAll = document.getElementById("exportPdfAll");

        let filteredRecords = [];
        let currentModalRecord = null;

        if (header) {
            header.innerHTML = createHeader(reportType, config);
        }

        if (title) {
            title.textContent = config.title;
        }

        renderTableHeader(config);

        function updateModalContent(record) {
            if (!modalTitle || !modalBody) {
                return;
            }

            modalTitle.textContent = `${config.title} - Entry`;
            const rows = config.columns
                .map(([field, label]) => `<div class="detail-row"><span class="label">${label}</span><span class="value">${record[field] ?? ""}</span></div>`)
                .join("");
            modalBody.innerHTML = rows;
        }

        function closeModal() {
            if (!modalOverlay) {
                return;
            }

            modalOverlay.classList.remove("open");
            document.body.style.overflow = "";
            currentModalRecord = null;
        }

        window.openModal = function(id) {
            if (!modalOverlay) {
                return;
            }

            const record = filteredRecords.find(r => String(r.id) === String(id));
            if (!record) {
                return;
            }

            currentModalRecord = record;
            updateModalContent(record);
            modalOverlay.classList.add("open");
            document.body.style.overflow = "hidden";
        };

        window.exportSinglePdf = function(id) {
            const record = filteredRecords.find(r => String(r.id) === String(id));
            if (!record) {
                return;
            }

            const node = createElementForPdf(buildSingleRecordPdfMarkup(config, record));
            document.body.appendChild(node);
            generatePdfFromElement(node, `${reportType}_entry_${id}.pdf`);
            setTimeout(() => node.remove(), 150);
        };

        if (modalClose) {
            modalClose.addEventListener("click", closeModal);
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener("click", closeModal);
        }

        if (modalOverlay) {
            modalOverlay.addEventListener("click", event => {
                if (event.target === modalOverlay) {
                    closeModal();
                }
            });
        }

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeModal();
            }
        });

        if (modalPdfBtn) {
            modalPdfBtn.addEventListener("click", () => {
                if (!currentModalRecord) {
                    return;
                }

                const node = createElementForPdf(buildSingleRecordPdfMarkup(config, currentModalRecord));
                document.body.appendChild(node);
                generatePdfFromElement(node, `${reportType}_entry_${currentModalRecord.id}.pdf`);
                setTimeout(() => node.remove(), 150);
            });
        }

        if (exportPdfAll) {
            exportPdfAll.addEventListener("click", () => {
                if (!filteredRecords.length) {
                    alert("No records to export for the current filters.");
                    return;
                }

                const monthValue = monthInput ? monthInput.value : "";
                const node = createElementForPdf(buildGroupedMonthlyPdfMarkup(config, filteredRecords, monthValue));
                document.body.appendChild(node);
                generatePdfFromElement(node, `${reportType}_monthly_grouped_${monthValue || "all"}.pdf`);
                setTimeout(() => node.remove(), 150);
            });
        }

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

                    filteredRecords = filtered;

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
                    const titleNode = empty.querySelector("h3");
                    if (titleNode) {
                        titleNode.textContent = "Unable to load report data file.";
                    }
                }
            });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
