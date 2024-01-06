trait FromLocal<L, R> {
    /// Convert from local table row to remote table row
    fn from_local(row: L) -> R;
}
