import { useState } from "react";
import { data, useLoaderData, useActionData, useSubmit, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") || "pending";

  const reviews = await db.review.findMany({
    where: { shop: session.shop, status: filter },
    orderBy: { createdAt: "desc" },
  });

  const counts = await db.review.groupBy({
    by: ["status"],
    where: { shop: session.shop },
    _count: true,
  });

  return data({ reviews, counts, filter });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = Number(formData.get("id"));

  if (intent === "approve") {
    await db.review.update({ where: { id }, data: { status: "approved" } });
    return data({ success: true, message: "✅ Review approved, now its showing on the product page." });
  }

  if (intent === "reject") {
    await db.review.update({ where: { id }, data: { status: "rejected" } });
    return data({ success: true, message: "❌ Review rejected." });
  }

  if (intent === "delete") {
    await db.review.delete({ where: { id } });
    return data({ success: true, message: "🗑️ Review deleted permanently!" });
  }

  return data({ error: "Invalid request" });
};

function StarRating({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(star => (
        <span key={star} style={{ color: star <= rating ? "#FFC107" : "#ddd", fontSize: "18px" }}>★</span>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending:  { bg: "#fff3cd", color: "#856404", label: "⏳ Pending" },
    approved: { bg: "#d1e7dd", color: "#0f5132", label: "✅ Approved" },
    rejected: { bg: "#f8d7da", color: "#842029", label: "❌ Rejected" },
  };
  const s = config[status] || config.pending;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
      {s.label}
    </span>
  );
}

export default function ReviewsPage() {
  const { reviews, counts, filter } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [activeFilter, setActiveFilter] = useState(filter);

  const getCount = (status) => {
    const found = counts.find(c => c.status === status);
    return found ? found._count : 0;
  };

  const handleAction = (intent, id) => {
    const messages = {
      approve: "Review approve",
      reject: "Review reject ",
      delete: "Review permanently delete?",
    };
    if (confirm(messages[intent])) {
      const formData = new FormData();
      formData.append("intent", intent);
      formData.append("id", id);
      submit(formData, { method: "post" });
    }
  };

  const handleFilterChange = (newFilter) => {
    setActiveFilter(newFilter);
    submit({ filter: newFilter }, { method: "get" });
  };

  const styles = {
    page: { padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", maxWidth: "1100px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    title: { fontSize: "24px", fontWeight: "bold", margin: 0 },
    statsRow: { display: "flex", gap: "16px", marginBottom: "24px" },
    statBox: (active) => ({ background: active ? "#008060" : "white", border: "1px solid " + (active ? "#008060" : "#e1e3e5"), borderRadius: "8px", padding: "16px 24px", flex: 1, textAlign: "center", cursor: "pointer", transition: "all 0.2s" }),
    statNum: (active) => ({ fontSize: "28px", fontWeight: "bold", color: active ? "white" : "#202223" }),
    statLabel: (active) => ({ fontSize: "13px", color: active ? "rgba(255,255,255,0.85)" : "#6d7175", marginTop: "4px" }),
    card: { background: "white", border: "1px solid #e1e3e5", borderRadius: "8px", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e1e3e5", fontSize: "13px", color: "#6d7175", fontWeight: "600", background: "#f9fafb" },
    td: { padding: "14px 16px", borderBottom: "1px solid #f1f2f3", fontSize: "14px", verticalAlign: "top" },
    btnApprove: {background: "#008060", color: "white", border: "none", padding: "6px 14px", borderRadius: "5px", cursor: "pointer", fontSize: "13px", marginRight: "6px" },
    btnReject: { background: "#FFC107", color: "#333", border: "none", padding: "6px 14px", borderRadius: "5px", cursor: "pointer", fontSize: "13px", marginRight: "6px" },
    btnDelete: { background: "#d72c0d", color: "white", border: "none", padding: "6px 14px", borderRadius: "5px", cursor: "pointer", fontSize: "13px" },
    banner: (type) => ({ padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", background: type === "success" ? "#d1e7dd" : "#f8d7da", color: type === "success" ? "#0f5132" : "#842029", fontWeight: "500" }),
    emptyBox: { textAlign: "center", padding: "48px", color: "#6d7175" },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Customer Reviews ⭐</h1>
          <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "14px" }}>
            Approve/Reject Reviews - Only approved reviews will appear on the product page
          </p>
        </div>
      </div>

      {actionData?.success && <div style={styles.banner("success")}>{actionData.message}</div>}
      {actionData?.error && <div style={styles.banner("error")}>{actionData.error}</div>}

      {/* Filter Tabs */}
      <div style={styles.statsRow}>
        {[
          { key: "pending", label: "⏳ Pending", emoji: "🔔" },
          { key: "approved", label: "✅ Approved", emoji: "✅" },
          { key: "rejected", label: "❌ Rejected", emoji: "❌" },
        ].map(tab => (
          <div key={tab.key} style={styles.statBox(activeFilter === tab.key)} onClick={() => handleFilterChange(tab.key)}>
            <div style={styles.statNum(activeFilter === tab.key)}>{getCount(tab.key)}</div>
            <div style={styles.statLabel(activeFilter === tab.key)}>{tab.label}</div>
          </div>
        ))}
      </div>

      {/* Reviews Table */}
      <div style={styles.card}>
        {reviews.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: "48px" }}>📭</div>
            <h3>There are no {activeFilter} reviews</h3>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Comment</th>
                <th style={styles.th}>Product ID</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td style={styles.td}>
                    <strong>{review.firstName} {review.lastName}</strong>
                  </td>
                  <td style={styles.td}>{review.email}</td>
                  <td style={styles.td}><StarRating rating={review.rating} /></td>
                  <td style={{ ...styles.td, maxWidth: "200px" }}>{review.comment}</td>
                  <td style={styles.td}>
                    <code style={{ fontSize: "11px", background: "#f1f2f3", padding: "2px 6px", borderRadius: "4px" }}>
                     
                        {review.productId}
                     
                    </code>
                  </td>
                  <td style={styles.td}>{new Date(review.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}><StatusBadge status={review.status} /></td>
                  <td style={styles.td}>
                    {review.status === "pending" && (
                      <>
                        <button style={styles.btnApprove} onClick={() => handleAction("approve", review.id)}>Approve</button>
                        <button style={styles.btnReject} onClick={() => handleAction("reject", review.id)}>Reject</button>
                      </>
                    )}
                    {review.status === "approved" && (
                      <button style={styles.btnReject} onClick={() => handleAction("reject", review.id)}>Unapprove</button>
                    )}
                    {review.status === "rejected" && (
                      <button style={styles.btnApprove} onClick={() => handleAction("approve", review.id)}>Re-approve</button>
                    )}
                    <button style={styles.btnDelete} onClick={() => handleAction("delete", review.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}