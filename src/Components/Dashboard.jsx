import React, { useState, useEffect, Suspense, lazy } from "react";
import { toast } from "react-toastify";
import { apiUrl } from "../services/api";

// Lazy loaded charts
const PieChart = lazy(() => import("./PieChart"));
const BarChart = lazy(() => import("./BarChart"));

const Dashboard = () => {
  const userId = localStorage.getItem("userId") || "guest";

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [expenses, setExpenses] = useState([]);       // paginated
  const [allExpenses, setAllExpenses] = useState([]); // FULL DATA
  const[loading,setLoading]=useState(true)
  const [budget, setBudget] = useState(0);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const limit = 5;

  // Fetch paginated + full data
  useEffect(() => {
    fetch(
      `${apiUrl}/expenses/read?userId=${userId}&page=${page}&limit=${limit}`
    )
      .then((res) => res.json())
      .then((data) => {
    const sortedPaginated = [...data.data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const sortedFull = [...data.allData].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    setExpenses(sortedPaginated);
    setAllExpenses(sortedFull);
    setTotalCount(data.totalCount);
    setLoading(false)
})
      .catch((err) => console.log(err));
  }, [userId, page]);
  const totalPages = Math.ceil(totalCount / limit);

  // Fetch budget
  useEffect(() => {
    fetch(
      `${apiUrl}/budget/read/${userId}`
    )
      .then((res) => res.json())
      .then((data) => setBudget(data.data.budget))
      .catch((err) => console.log(err));
  }, [userId]);

  // Category summary based on FULL DATA
  const getCategorySummary = (expensesArr) => {
    const summary = {};
    expensesArr.forEach((exp) => {
      // guard for missing fields
      const cat = exp.category || "Other";
      const amt = Number(exp.amount) || 0;
      summary[cat] = (summary[cat] || 0) + amt;
    });
    return summary;
  };

  const categorySummary = getCategorySummary(allExpenses);
  const amounts = Object.values(categorySummary);
  const categories = Object.keys(categorySummary);

  // Delete expense
  const handleDelete = async () => {
    try {
      await fetch(
        `${apiUrl}/expenses/remove/${deleteId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      // Remove from paginated data
      setExpenses((prev) => prev.filter((exp) => exp._id !== deleteId));

      // Remove from full expenses
      setAllExpenses((prev) => prev.filter((exp) => exp._id !== deleteId));

      // also adjust totalCount (optional)
      setTotalCount((prev) => Math.max(0, prev - 1));

      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Error deleting expense");
    } finally {
      setShowModal(false);
      setDeleteId(null);
    }
  };

  // Update budget
  async function handleBudget(e) {
    const newBudget = Number(e.target.value);
    setBudget(newBudget);

    try {
      await fetch(
        `${apiUrl}/budget/add`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: userId, budget: newBudget }),
        }
      );
    } catch (error) {
      console.error(error);
    }
  }
function checkLimit(){
  const totalAmount= allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  if(totalAmount>budget){
    return null;
  }
  return totalAmount;
}
  // Budget calculation
  const totalExpense =checkLimit();
  
  const remaining =
    totalExpense ===null ? "Exceeded" : Math.max(budget - totalExpense, 0);

  return (
    <div className="bg-gray-100 min-h-screen font-sans p-4 md:p-6">
      <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6 md:p-10 max-w-7xl mx-auto dashboard-container">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          Smart Expense Tracker Dashboard
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* Total Expenses */}
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-6 rounded-2xl shadow-lg">
            <p className="text-lg font-medium">Total Expenses</p>
            <p className="text-4xl font-bold mt-2">
              ₹{totalExpense === null ? "Exceeded" : totalExpense}
            </p>
          </div>

          {/* Budget */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <p className="text-lg font-medium">Your Budget</p>
              <input
                type="number"
                value={budget}
                onChange={handleBudget}
                className="bg-white text-gray-800 rounded-md px-3 py-1 text-sm sm:w-50"
                placeholder="Enter ₹"
              />
            </div>

            <p className="text-4xl font-bold">₹{budget}</p>

            <div className="mt-4">
              <p className="text-lg font-medium">Remaining Amount</p>
              <p
                className={`text-4xl font-bold mt-2 ${
                  remaining === "Exceeded" ? "text-red-400" : ""
                }`}
              >
                {remaining === "Exceeded" ? remaining : `₹${remaining}`}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Recent Expenses
            </h2>

            <div className="overflow-x-auto w-full">
              <table className="min-w-full border border-gray-200 bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs sm:text-sm uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-sm sm:text-base">
                  {loading?(
                    <tr>
                    <td colSpan={5} className="py-10">
                      <div className="flex items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
                      </div>
                    </td>
                  </tr>
                  ):expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-400">
                        No expenses yet
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          {(exp.item || "").charAt(0).toUpperCase() +
                            (exp.item || "").slice(1).toLowerCase()}
                        </td>
                        <td className="px-4 py-3">{exp.category}</td>
                        <td className="px-4 py-3">₹{exp.amount}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {exp.date ? new Date(exp.date).toLocaleDateString() : "-"}
                        </td>

                        {/* Desktop delete icon */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <button
                            onClick={() => {
                              setDeleteId(exp._id);
                              setShowModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            aria-label={`Delete expense ${exp.item}`}
                          >
                            ❌
                          </button>
                        </td>

                        {/* Mobile delete button (visible only on small screens) */}
                        <td className="px-4 py-2 sm:hidden">
                          <button
                            onClick={() => {
                              setDeleteId(exp._id);
                              setShowModal(true);
                            }}
                            className="cursor-pointer mt-2 bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600 cursor-pointer"
                            aria-label={`Delete expense ${exp.item}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

            </div>
              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="cursor-pointer px-5 py-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ⬅ Prev
                </button>

                <span className="cursor-pointer text-gray-700 font-semibold text-sm">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="cursor-pointer px-5 py-2 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next ➡
                </button>
              </div>
          </div>

          {/* Charts */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Category-wise Spending
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 h-60 flex justify-center items-center">
              <Suspense fallback={<p>Loading Pie Chart...</p>}>
                <PieChart amounts={amounts} categories={categories} />
              </Suspense>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-4 text-gray-700">
              Category-wise Summary
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 h-48 flex justify-center items-center">
              <Suspense fallback={<p>Loading Bar Chart...</p>}>
                <BarChart amounts={amounts} categories={categories} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96">
            <div className="border-b px-6 py-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Confirm Delete
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-gray-700">
              Are you sure you want to delete this expense?
            </div>

            <div className="border-t px-6 py-3 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
