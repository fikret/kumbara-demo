var DB = (function () {
  var SUPABASE_URL = "https://mgshlmmsihjwnnhnrpyh.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2hsbW1zaWhqd25uaG5ycHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODg1MDgsImV4cCI6MjA4Nzg2NDUwOH0.XwbcLnSRI6KI_L4Qw5iNCBJi6EDP105zKaasT5kcYKo";

  var client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- Auth ---

  async function signUp(email, password) {
    var { data, error } = await client.auth.signUp({ email: email, password: password });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    var { data, error } = await client.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    var { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getUser() {
    var { data } = await client.auth.getUser();
    return data.user;
  }

  function onAuthStateChange(callback) {
    return client.auth.onAuthStateChange(callback);
  }

  // --- Savings ---

  async function fetchSavings() {
    var { data, error } = await client
      .from("savings")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map(function (row) {
      return {
        id: row.id,
        amount: parseFloat(row.amount),
        note: row.note || "",
        date: row.created_at,
      };
    });
  }

  async function addSaving(amount, note) {
    var { data, error } = await client
      .from("savings")
      .insert({ amount: amount, note: note || "" })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      amount: parseFloat(data.amount),
      note: data.note || "",
      date: data.created_at,
    };
  }

  async function deleteSaving(id) {
    var { error } = await client.from("savings").delete().eq("id", id);
    if (error) throw error;
  }

  // --- Settings ---

  async function getSetting(key) {
    var { data, error } = await client
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data ? data.value : null;
  }

  async function setSetting(key, value) {
    var { error } = await client
      .from("settings")
      .upsert({ key: key, value: value }, { onConflict: "key,user_id" });
    if (error) throw error;
  }

  async function getGoal() {
    return await getSetting("goal");
  }

  async function setGoal(value) {
    await setSetting("goal", value);
  }

  async function getBadges() {
    var val = await getSetting("badges");
    return val || [];
  }

  async function saveBadges(badges) {
    await setSetting("badges", badges);
  }

  return {
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getUser: getUser,
    onAuthStateChange: onAuthStateChange,
    fetchSavings: fetchSavings,
    addSaving: addSaving,
    deleteSaving: deleteSaving,
    getGoal: getGoal,
    setGoal: setGoal,
    getBadges: getBadges,
    saveBadges: saveBadges,
  };
})();
