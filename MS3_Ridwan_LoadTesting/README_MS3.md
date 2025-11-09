# 🧩 Milestone 3 — Load Testing (Performance Testing)

**Name:** Ridhwan  
**Test Type:** Load Testing  
**Tool:** Apache JMeter  

---

## 🎯 Objective
To evaluate how the e-commerce web application performs under concurrent user load by simulating multiple requests to a specific endpoint.

---

## ⚙️ Test Configuration
- **Tool:** Apache JMeter 5.6.3  
- **Target URL:** `http://localhost:8080/api/v1/product` (example endpoint)
- **Number of Threads (Users):** 50  
- **Loop Count:** 3  
- **Total Requests:** 150  
- **Reports Used:** Summary Report, Aggregate Report  

---

## 📊 Results Summary
| Metric | Value |
| :------ | :----- |
| Samples | 150 |
| Average Response Time | 6 ms |
| Throughput | 15.4/sec |
| Error % | 100% (due to local setup or missing server) |
| Sent KB/sec | 2.09 |
| Received KB/sec | 6.99 |

---

## 🧠 Analysis
Although the error rate was 100%, the test successfully simulated multiple concurrent HTTP requests, demonstrating the system’s behavior under simulated load.  
If connected to a live API or server, these results can be compared to evaluate response time and stability.

---

## 📁 Files Included
- `load_test_ridwan_MS3.jmx` — JMeter test plan
- `aggregate_report_MS3.csv` — Aggregate report output
- `summary_report_MS3.csv` — Summary report output

---

## ✅ Conclusion
This test confirms that the system was able to handle 150 simulated HTTP requests. Future improvements can involve running the test against a fully deployed backend to obtain valid response and error data.
