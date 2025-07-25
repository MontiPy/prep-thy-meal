import React, { useState, useEffect } from "react";
import {
  addCustomIngredient,
  removeCustomIngredient,
  upsertCustomIngredient,
  syncFromRemote,
} from "../utils/ingredientStorage";
import { useUser } from "../context/UserContext.jsx";
import { getAllBaseIngredients } from "../utils/nutritionHelpers";
import { fetchNutritionByName, searchFoods } from "../utils/nutritionixApi";

const empty = {
  name: "",
  grams: 100,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const IngredientManager = ({ onChange }) => {
  const { user } = useUser();
  const [ingredients, setIngredients] = useState(getAllBaseIngredients());
  const [newIngredient, setNewIngredient] = useState({ ...empty });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ ...empty });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    const foods = await searchFoods(searchQuery.trim());
    setSearchResults(foods);
  };

  const addFromApi = async (item) => {
    const { name } = item;
    const details =
      item.grams !== undefined ? item : await fetchNutritionByName(name);
    if (!details) return;
    await addCustomIngredient({ name, ...details }, user?.uid);
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
    await addCustomIngredient({ ...newIngredient }, user?.uid);
    setNewIngredient({ ...empty });
    refresh();
  };

  const startEdit = (ing) => {
    setEditingId(ing.id);
    setEditData({ ...ing });
  };

  const saveEdit = async () => {
    await upsertCustomIngredient(editData, user?.uid);
    setEditingId(null);
    refresh();
  };

  const handleRemove = async (id) => {
    await removeCustomIngredient(id, user?.uid);
    refresh();
  };

  const handleChange = (setter) => (e) =>
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Ingredient Manager</h2>
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
                  <th className="border p-1">g</th>
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
                    <td className="border p-1 text-center">{res.grams !== undefined ? res.grams : "-"}</td>
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
                <th className="border p-1">g</th>
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
                  <input
                    name="grams"
                    type="number"
                    value={newIngredient.grams}
                    onChange={handleChange(setNewIngredient)}
                    className="border px-1 w-full"
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
            <th className="border p-1">Name</th>
            <th className="border p-1">g</th>
            <th className="border p-1">Cal</th>
            <th className="border p-1">P</th>
            <th className="border p-1">C</th>
            <th className="border p-1">F</th>
            <th className="border p-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
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
                    <input
                      name="grams"
                      type="number"
                      value={editData.grams}
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
                  <td className="border p-1 text-center">{ing.grams}</td>
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
    </div>
  );
};

export default IngredientManager;
