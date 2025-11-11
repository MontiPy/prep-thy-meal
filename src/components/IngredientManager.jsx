import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  addCustomIngredient,
  removeCustomIngredient,
  upsertCustomIngredient,
  syncFromRemote,
} from "../utils/ingredientStorage";
import { useUser } from "../context/UserContext.jsx";
import { getAllBaseIngredients } from "../utils/nutritionHelpers";
import { fetchNutritionByName, searchFoods } from "../utils/nutritionixApi";
import ConfirmDialog from "./ConfirmDialog";

const empty = {
  name: "",
  grams: 100,
  gramsPerUnit: 100,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  unit: "g",
};

const IngredientManager = ({ onChange }) => {
  const { user } = useUser();
  const [ingredients, setIngredients] = useState(getAllBaseIngredients());
  const [newIngredient, setNewIngredient] = useState({ ...empty });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ ...empty });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const csvImportRef = useRef(null);

  // Search, Sort, Filter state
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, calories, protein, carbs, fat
  const [sortDirection, setSortDirection] = useState("asc"); // asc, desc
  const [filterType, setFilterType] = useState("all"); // all, custom, standard

  // Filtered and sorted ingredients
  const filteredIngredients = React.useMemo(() => {
    let result = [...ingredients];

    // Apply search filter
    if (ingredientSearch.trim()) {
      const searchLower = ingredientSearch.toLowerCase();
      result = result.filter(ing =>
        ing.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (filterType === "custom") {
      result = result.filter(ing => ing.id >= 1000); // Custom ingredients have ID >= 1000
    } else if (filterType === "standard") {
      result = result.filter(ing => ing.id < 1000);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "calories":
          aVal = a.calories;
          bVal = b.calories;
          break;
        case "protein":
          aVal = a.protein;
          bVal = b.protein;
          break;
        case "carbs":
          aVal = a.carbs;
          bVal = b.carbs;
          break;
        case "fat":
          aVal = a.fat;
          bVal = b.fat;
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    return result;
  }, [ingredients, ingredientSearch, sortBy, sortDirection, filterType]);

  const handleSearch = async () => {
    const foods = await searchFoods(searchQuery.trim());
    setSearchResults(foods);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const addFromApi = async (item) => {
    const { name } = item;
    const details =
      item.grams !== undefined ? item : await fetchNutritionByName(name);
    if (!details) return;

    const ingredientToAdd = { name, ...details };

    // Ensure gramsPerUnit and grams are always equal
    if (!ingredientToAdd.gramsPerUnit) {
      ingredientToAdd.gramsPerUnit = ingredientToAdd.grams;
    }
    ingredientToAdd.grams = ingredientToAdd.gramsPerUnit;

    await addCustomIngredient(ingredientToAdd, user?.uid);
    setSearchResults([]);
    setSearchQuery("");
    refresh();
  };

  const refresh = () => {
    setIngredients(getAllBaseIngredients());
    onChange && onChange(getAllBaseIngredients());
  };

  useEffect(() => {
    if (user) {
      syncFromRemote(user.uid).then(refresh);
    } else {
      refresh();
    }
  }, [user]);

  const handleAdd = async () => {
    if (!newIngredient.name.trim()) return;
    const ingredientToAdd = { ...newIngredient };

    // Ensure gramsPerUnit and grams are always equal
    ingredientToAdd.grams = ingredientToAdd.gramsPerUnit;

    await addCustomIngredient(ingredientToAdd, user?.uid);
    setNewIngredient({ ...empty });
    refresh();
  };

  const startEdit = (ing) => {
    setEditingId(ing.id);
    setEditData({ ...ing });
  };

  const saveEdit = async () => {
    const ingredientToSave = { ...editData };

    // Ensure gramsPerUnit and grams are always equal
    ingredientToSave.grams = ingredientToSave.gramsPerUnit;

    await upsertCustomIngredient(ingredientToSave, user?.uid);
    setEditingId(null);
    refresh();
  };

  const handleRemove = (id) => {
    const ing = ingredients.find(i => i.id === id);
    setIngredientToDelete({ id, name: ing?.name || 'this ingredient' });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteIngredient = async () => {
    if (!ingredientToDelete) return;
    await removeCustomIngredient(ingredientToDelete.id, user?.uid);
    refresh();
    setIngredientToDelete(null);
  };

  const handleChange = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => {
      const updated = { ...prev, [name]: value };

      // gramsPerUnit should always equal grams
      if (name === "gramsPerUnit") {
        updated.grams = value;
      } else if (name === "grams") {
        updated.gramsPerUnit = value;
      }

      return updated;
    });
  };

  const handleExportCSV = () => {
    // Create CSV header
    const headers = ['Name', 'Unit', 'Grams per Unit', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];

    // Create CSV rows
    const rows = ingredients.map(ing => [
      ing.name,
      ing.unit || 'g',
      ing.gramsPerUnit || ing.grams || 100,
      ing.calories,
      ing.protein,
      ing.carbs,
      ing.fat,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        // Escape cells that contain commas
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingredients_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Ingredients exported to CSV!');
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        // Skip header
        const dataLines = lines.slice(1);

        let imported = 0;
        let errors = 0;

        for (const line of dataLines) {
          try {
            // Parse CSV line (handle quoted fields)
            const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());

            if (cleanFields.length < 7) continue; // Skip incomplete rows

            const [name, unit, gramsPerUnit, calories, protein, carbs, fat] = cleanFields;

            const ingredient = {
              name: name,
              unit: unit || 'g',
              gramsPerUnit: parseFloat(gramsPerUnit) || 100,
              grams: parseFloat(gramsPerUnit) || 100,
              calories: parseFloat(calories) || 0,
              protein: parseFloat(protein) || 0,
              carbs: parseFloat(carbs) || 0,
              fat: parseFloat(fat) || 0,
            };

            await addCustomIngredient(ingredient, user?.uid);
            imported++;
          } catch (err) {
            console.error('Error importing line:', line, err);
            errors++;
          }
        }

        refresh();

        if (imported > 0) {
          toast.success(`Successfully imported ${imported} ingredient(s)!`);
        }
        if (errors > 0) {
          toast.warning(`${errors} row(s) failed to import.`);
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        toast.error('Failed to import CSV. Please check the file format.');
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Ingredient Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => csvImportRef.current?.click()}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            📤 Import CSV
          </button>
          <input
            ref={csvImportRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportCSV}
            style={{ display: 'none' }}
            aria-label="Import ingredients from CSV file"
          />
        </div>
      </div>

      {/* Search, Sort, Filter Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Box */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              placeholder="🔍 Search ingredients..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by Type */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({ingredients.length})</option>
              <option value="custom">Custom Only ({ingredients.filter(i => i.id >= 1000).length})</option>
              <option value="standard">Standard Only ({ingredients.filter(i => i.id < 1000).length})</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="calories">Calories</option>
              <option value="protein">Protein</option>
              <option value="carbs">Carbs</option>
              <option value="fat">Fat</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-medium text-sm"
              title={sortDirection === "asc" ? "Ascending" : "Descending"}
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {filteredIngredients.length} of {ingredients.length} ingredients
          {ingredientSearch && ` matching "${ingredientSearch}"`}
        </div>
      </div>

      {/* API Search */}
      <div className="space-y-2 mb-6">
        <h3 className="font-semibold">Add from Nutritionix</h3>
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="border px-2 py-1"
          />
          <button className="btn-blue" type="button" onClick={handleSearch}>
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-max w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1">Name</th>
                  <th className="border p-1">Unit</th>
                  <th className="border p-1">g/unit</th>
                  <th className="border p-1">Cal</th>
                  <th className="border p-1">P</th>
                  <th className="border p-1">C</th>
                  <th className="border p-1">F</th>
                  <th className="border p-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((res) => (
                  <tr key={res.id} className="border-t">
                    <td className="border p-1 capitalize">{res.name}</td>
                    <td className="border p-1 text-center">{res.unit || "g"}</td>
                    <td className="border p-1 text-center">{res.gramsPerUnit || res.grams || "-"}</td>
                    <td className="border p-1 text-center">{res.calories !== undefined ? res.calories : "-"}</td>
                    <td className="border p-1 text-center">{res.protein !== undefined ? res.protein : "-"}</td>
                    <td className="border p-1 text-center">{res.carbs !== undefined ? res.carbs : "-"}</td>
                    <td className="border p-1 text-center">{res.fat !== undefined ? res.fat : "-"}</td>
                    <td className="border p-1 text-center">
                      <button className="btn-green" type="button" onClick={() => addFromApi(res)}>
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="space-y-2 mb-6">
        <h3 className="font-semibold">Add Custom Ingredient</h3>
        <div className="overflow-x-auto">
          <table className="min-w-max w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1">Name</th>
                <th className="border p-1">Unit</th>
                <th className="border p-1">g/unit</th>
                <th className="border p-1">Cal</th>
                <th className="border p-1">P</th>
                <th className="border p-1">C</th>
                <th className="border p-1">F</th>
                <th className="border p-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1">
                  <input
                    name="name"
                    value={newIngredient.name}
                    onChange={handleChange(setNewIngredient)}
                    placeholder="Name"
                    className="border px-1 w-full"
                  />
                </td>
                <td className="border p-1">
                  <select
                    name="unit"
                    value={newIngredient.unit}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
                  >
                    <option value="g">g</option>
                    <option value="unit">unit</option>
                  </select>
                </td>
                <td className="border p-1">
                  <input
                    name="gramsPerUnit"
                    type="number"
                    value={newIngredient.gramsPerUnit}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
                    placeholder="100"
                  />
                </td>
                <td className="border p-1">
                  <input
                    name="calories"
                    type="number"
                    value={newIngredient.calories}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
                  />
                </td>
                <td className="border p-1">
                  <input
                    name="protein"
                    type="number"
                    value={newIngredient.protein}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
                  />
                </td>
                <td className="border p-1">
                  <input
                    name="carbs"
                    type="number"
                    value={newIngredient.carbs}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
                  />
                </td>
                <td className="border p-1">
                  <input
                    name="fat"
                    type="number"
                    value={newIngredient.fat}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
                  />
                </td>
                <td className="border p-1 text-center">
                  <button className="btn-green" onClick={handleAdd}>
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="min-w-max w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th
              className="border p-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleSort("name")}
              title="Click to sort by name"
            >
              Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="border p-1">Unit</th>
            <th className="border p-1">g/unit</th>
            <th
              className="border p-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleSort("calories")}
              title="Click to sort by calories"
            >
              Cal {sortBy === "calories" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="border p-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleSort("protein")}
              title="Click to sort by protein"
            >
              P {sortBy === "protein" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="border p-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleSort("carbs")}
              title="Click to sort by carbs"
            >
              C {sortBy === "carbs" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="border p-1 cursor-pointer hover:bg-gray-200"
              onClick={() => toggleSort("fat")}
              title="Click to sort by fat"
            >
              F {sortBy === "fat" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="border p-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredIngredients.map((ing) => (
            <tr key={ing.id} className="border-t">
              {editingId === ing.id ? (
                <>
                  <td className="border p-1">
                    <input
                      name="name"
                      value={editData.name}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    />
                  </td>
                  <td className="border p-1">
                    <select
                      name="unit"
                      value={editData.unit || "g"}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    >
                      <option value="g">g</option>
                      <option value="unit">unit</option>
                    </select>
                  </td>
                  <td className="border p-1">
                    <input
                      name="gramsPerUnit"
                      type="number"
                      value={editData.gramsPerUnit || editData.grams || 100}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      name="calories"
                      type="number"
                      value={editData.calories}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      name="protein"
                      type="number"
                      value={editData.protein}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      name="carbs"
                      type="number"
                      value={editData.carbs}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    />
                  </td>
                  <td className="border p-1">
                    <input
                      name="fat"
                      type="number"
                      value={editData.fat}
                      onChange={handleChange(setEditData)}
                      className="border px-1 w-full"
                    />
                  </td>
                  <td className="border p-1">
                    <button className="text-green-600 mr-1" onClick={saveEdit}>
                      Save
                    </button>
                    <button
                      className="text-red-600"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border p-1 capitalize">{ing.name}</td>
                  <td className="border p-1 text-center">{ing.unit || "g"}</td>
                  <td className="border p-1 text-center">{ing.gramsPerUnit || ing.grams || 100}</td>
                  <td className="border p-1 text-center">{ing.calories}</td>
                  <td className="border p-1 text-center">{ing.protein}</td>
                  <td className="border p-1 text-center">{ing.carbs}</td>
                  <td className="border p-1 text-center">{ing.fat}</td>
                  <td className="border p-1 text-center space-x-1">
                    <button
                      className="text-blue-600"
                      onClick={() => startEdit(ing)}
                    >
                      Edit
                    </button>
                    {ing.id >= 1000 && (
                      <button
                        className="text-red-600"
                        onClick={() => handleRemove(ing.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setIngredientToDelete(null);
        }}
        onConfirm={confirmDeleteIngredient}
        title="Delete Ingredient?"
        message={`Are you sure you want to delete "${ingredientToDelete?.name}"?\n\nThis will remove it from your custom ingredients list. Any meal plans using this ingredient will show it as unavailable.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default IngredientManager;
