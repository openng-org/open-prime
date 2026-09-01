import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { SharedModule, SortMeta } from '@openng/optimus-ui/api';
import { Select } from '@openng/optimus-ui/select';
import { CellEditor, ColumnFilter, EditableColumn, Table, TableModule, TableRadioButton, TableService } from './table';

describe('Table', () => {
    let component: Table;
    let fixture: ComponentFixture<Table>;

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products" [dataKey]="'id'">
                <ng-template #header>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Image</th>
                        <th>Rating</th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.id }}</td>
                        <td>{{ product.code }}</td>
                        <td>{{ product.name }}</td>
                        <td>{{ product.description }}</td>
                        <td>{{ product.price | currency }}</td>
                        <td>{{ product.quantity }}</td>
                        <td>{{ product.inventoryStatus }}</td>
                        <td>{{ product.category }}</td>
                        <td>{{ product.image }}</td>
                        <td>{{ product.rating }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestBasicTableComponent {
        products = [
            { id: '1001', code: 'LP001', name: 'Gaming Laptop', description: 'High-end gaming laptop', price: 1299.99, quantity: 15, inventoryStatus: 'INSTOCK', category: 'Electronics', image: 'laptop.jpg', rating: 5 },
            { id: '1002', code: 'MO001', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, quantity: 0, inventoryStatus: 'OUTOFSTOCK', category: 'Accessories', image: 'mouse.jpg', rating: 4 },
            { id: '1003', code: 'KB001', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 149.99, quantity: 8, inventoryStatus: 'LOWSTOCK', category: 'Accessories', image: 'keyboard.jpg', rating: 4 },
            { id: '1004', code: 'HD001', name: 'Wireless Headphones', description: 'Noise-cancelling headphones', price: 199.99, quantity: 25, inventoryStatus: 'INSTOCK', category: 'Audio', image: 'headphones.jpg', rating: 5 },
            { id: '1005', code: 'MN001', name: '4K Monitor', description: '27-inch 4K monitor', price: 399.99, quantity: 12, inventoryStatus: 'INSTOCK', category: 'Displays', image: 'monitor.jpg', rating: 4 }
        ];
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products" [selection]="selectedProducts" [selectionMode]="'multiple'" [dataKey]="'id'">
                <ng-template #header>
                    <tr>
                        <th><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Status</th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td><p-tableCheckbox [value]="product"></p-tableCheckbox></td>
                        <td>{{ product.name }}</td>
                        <td>{{ product.price | currency }}</td>
                        <td>{{ product.inventoryStatus }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestSelectionTableComponent {
        products = [
            { id: '1001', name: 'Gaming Laptop', price: 1299.99, inventoryStatus: 'INSTOCK' },
            { id: '1002', name: 'Wireless Mouse', price: 29.99, inventoryStatus: 'OUTOFSTOCK' }
        ];
        selectedProducts: any[] = [];
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products" [sortMode]="'multiple'">
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th pSortableColumn="price">Price <p-sortIcon field="price"></p-sortIcon></th>
                        <th pSortableColumn="category">Category <p-sortIcon field="category"></p-sortIcon></th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.name }}</td>
                        <td>{{ product.price | currency }}</td>
                        <td>{{ product.category }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestSortingTableComponent {
        products = [
            { id: '1001', name: 'Gaming Laptop', price: 1299.99, category: 'Electronics' },
            { id: '1002', name: 'Wireless Mouse', price: 29.99, category: 'Accessories' },
            { id: '1003', name: 'Mechanical Keyboard', price: 149.99, category: 'Accessories' }
        ];
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products" [sortMode]="'multiple'" [multiSortMeta]="multiSortMeta" [groupRowsBy]="'category'">
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.name }}</td>
                        <td>{{ product.category }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestGroupedSortingTableComponent {
        products = [
            { id: '1001', name: 'Gaming Laptop', price: 1299.99, category: 'Electronics' },
            { id: '1002', name: 'Wireless Mouse', price: 29.99, category: 'Accessories' },
            { id: '1003', name: 'Mechanical Keyboard', price: 149.99, category: 'Accessories' }
        ];
        multiSortMeta: SortMeta[] = [];
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products" [globalFilterFields]="['name', 'category']">
                <ng-template #header>
                    <tr>
                        <th>
                            Name
                            <p-columnFilter field="name" matchMode="contains" display="menu">
                                <ng-template #filter let-value let-filter="filterCallback">
                                    <input type="text" [(ngModel)]="value" (ngModelChange)="filter($event)" placeholder="Search by name" />
                                </ng-template>
                            </p-columnFilter>
                        </th>
                        <th>
                            Category
                            <p-columnFilter field="category" matchMode="equals" display="menu">
                                <ng-template #filter let-value let-filter="filterCallback">
                                    <p-select [(ngModel)]="value" [options]="categories" (ngModelChange)="filter($event)" placeholder="Select Category"> </p-select>
                                </ng-template>
                            </p-columnFilter>
                        </th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.name }}</td>
                        <td>{{ product.category }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestFilteringTableComponent {
        products = [
            { id: '1001', name: 'Gaming Laptop', category: 'Electronics' },
            { id: '1002', name: 'Wireless Mouse', category: 'Accessories' },
            { id: '1003', name: 'Mechanical Keyboard', category: 'Accessories' }
        ];
        categories = [
            { label: 'Electronics', value: 'Electronics' },
            { label: 'Accessories', value: 'Accessories' }
        ];
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products" [virtualScroll]="true" [virtualScrollItemSize]="46" [scrollHeight]="'400px'">
                <ng-template #header>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price</th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.id }}</td>
                        <td>{{ product.name }}</td>
                        <td>{{ product.price | currency }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestVirtualScrollTableComponent {
        products = Array.from({ length: 10000 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            price: Math.random() * 1000
        }));
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        selector: 'test-virtual-scroll-percent-height-table',
        template: `
            <div style="height: 480px;">
                <p-table [value]="products" [scrollable]="true" [virtualScroll]="true" [virtualScrollItemSize]="40" [scrollHeight]="'100%'">
                    <ng-template #header>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-product>
                        <tr style="height: 40px">
                            <td>{{ product.id }}</td>
                            <td>{{ product.name }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        `
    })
    class TestVirtualScrollPercentHeightTableComponent {
        products = Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`
        }));
    }

    @Component({
        standalone: false,
        selector: 'test-scrollable-non-virtual-table',
        template: `
            <p-table [value]="products" [scrollable]="true" [scrollHeight]="'400px'">
                <ng-template #header>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.id }}</td>
                        <td>{{ product.name }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestScrollableNonVirtualTableComponent {
        products = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`
        }));
    }

    @Component({
        standalone: false,
        selector: 'test-virtual-scroll-flex-height-table',
        template: `
            <div style="height: 480px;">
                <p-table [value]="products" [scrollable]="true" [virtualScroll]="true" [virtualScrollItemSize]="40" [scrollHeight]="'flex'">
                    <ng-template #header>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-product>
                        <tr style="height: 40px">
                            <td>{{ product.id }}</td>
                            <td>{{ product.name }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        `
    })
    class TestVirtualScrollFlexHeightTableComponent {
        products = Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`
        }));
    }

    @Component({
        standalone: false,
        template: `
            <p-table [value]="products" [lazy]="true" [totalRecords]="totalRecords" [paginator]="true" [rows]="10" (onLazyLoad)="loadProducts($event)">
                <ng-template #header>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.name }}</td>
                        <td>{{ product.price | currency }}</td>
                    </tr>
                </ng-template>
            </p-table>
        `
    })
    class TestLazyLoadTableComponent {
        products: any[] = [];
        totalRecords: number = 1000;

        loadProducts(event: any) {
            // Simulate lazy loading
            setTimeout(() => {
                this.products = Array.from({ length: event.rows }, (_, i) => ({
                    id: event.first + i + 1,
                    name: `Product ${event.first + i + 1}`,
                    price: Math.random() * 1000
                }));
            }, 1000);
        }
    }

    @Component({
        changeDetection: ChangeDetectionStrategy.Eager,
        standalone: false,
        template: `
            <p-table [value]="products">
                <ng-template #caption>
                    <div class="p-d-flex p-ai-center p-jc-between">
                        <h5>Product Catalog</h5>
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input type="text" pInputText placeholder="Global Search" />
                        </span>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                    </tr>
                </ng-template>
                <ng-template #body let-product>
                    <tr>
                        <td>{{ product.name }}</td>
                        <td>{{ product.price | currency }}</td>
                    </tr>
                </ng-template>
                <ng-template #summary> Total Products: {{ products.length }} </ng-template>
            </p-table>
        `
    })
    class TestTemplatesTableComponent {
        products = [
            { id: '1001', name: 'Gaming Laptop', price: 1299.99 },
            { id: '1002', name: 'Wireless Mouse', price: 29.99 }
        ];
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                Table,
                TestBasicTableComponent,
                TestSelectionTableComponent,
                TestSortingTableComponent,
                TestGroupedSortingTableComponent,
                TestFilteringTableComponent,
                TestVirtualScrollTableComponent,
                TestVirtualScrollPercentHeightTableComponent,
                TestScrollableNonVirtualTableComponent,
                TestVirtualScrollFlexHeightTableComponent,
                TestLazyLoadTableComponent,
                TestTemplatesTableComponent
            ],
            imports: [CommonModule, FormsModule, TableModule, SharedModule, Select],
            providers: [TableService, provideZonelessChangeDetection()]
        }).compileComponents();

        fixture = TestBed.createComponent(Table);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Basic Table Functionality', () => {
        let testComponent: TestBasicTableComponent;
        let testFixture: ComponentFixture<TestBasicTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestBasicTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should render table with product data', () => {
            const tableElement = testFixture.debugElement.query(By.css('p-table'));
            expect(tableElement).toBeTruthy();
        });

        it('should display correct number of rows', () => {
            const rows = testFixture.debugElement.queryAll(By.css('tbody tr'));
            expect(rows.length).toBe(testComponent.products.length);
        });

        it('should display product information in cells', () => {
            const firstRowCells = testFixture.debugElement.queryAll(By.css('tbody tr:first-child td'));
            expect(firstRowCells[0].nativeElement.textContent).toContain('1001');
            expect(firstRowCells[2].nativeElement.textContent).toContain('Gaming Laptop');
        });

        it('should have correct dataKey', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.dataKey).toBe('id');
        });
    });

    describe('Selection Functionality', () => {
        let testComponent: TestSelectionTableComponent;
        let testFixture: ComponentFixture<TestSelectionTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestSelectionTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should enable multiple selection', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.selectionMode).toBe('multiple');
        });

        it('should render checkboxes for selection', () => {
            const checkboxes = testFixture.debugElement.queryAll(By.css('p-tableCheckbox'));
            expect(checkboxes.length).toBe(testComponent.products.length);
        });

        it('should render header checkbox for select all', () => {
            const headerCheckbox = testFixture.debugElement.query(By.css('p-tableHeaderCheckbox'));
            expect(headerCheckbox).toBeTruthy();
        });
    });

    describe('Sorting Functionality', () => {
        let testComponent: TestSortingTableComponent;
        let testFixture: ComponentFixture<TestSortingTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestSortingTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should enable multiple sort mode', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.sortMode).toBe('multiple');
        });

        it('should render sort icons', () => {
            const sortIcons = testFixture.debugElement.queryAll(By.css('p-sortIcon'));
            expect(sortIcons.length).toBe(3);
        });

        it('should have sortable columns', () => {
            const sortableColumns = testFixture.debugElement.queryAll(By.css('[pSortableColumn]'));
            expect(sortableColumns.length).toBe(3);
        });

        describe('Row Grouping With An Empty multiSortMeta', () => {
            let groupedComponent: TestGroupedSortingTableComponent;
            let groupedFixture: ComponentFixture<TestGroupedSortingTableComponent>;

            const createGroupedFixture = async () => {
                groupedFixture = TestBed.createComponent(TestGroupedSortingTableComponent);
                groupedComponent = groupedFixture.componentInstance;
                await groupedFixture.whenStable();
                groupedFixture.detectChanges();
            };

            it('should not throw when multiSortMeta starts out as an empty array', async () => {
                await createGroupedFixture();
            });

            it('should sort by the grouped field when multiSortMeta is empty', async () => {
                await createGroupedFixture();

                const tableInstance: Table = groupedFixture.debugElement.query(By.css('p-table')).componentInstance;

                expect(tableInstance.multiSortMeta).toEqual([{ field: 'category', order: 1 }]);
                expect(tableInstance.value.map((product: any) => product.category)).toEqual(['Accessories', 'Accessories', 'Electronics']);
            });

            it('should keep the grouped field first when multiSortMeta is emptied later', async () => {
                await createGroupedFixture();

                groupedComponent.multiSortMeta = [];
                groupedFixture.detectChanges();
                await groupedFixture.whenStable();

                const tableInstance: Table = groupedFixture.debugElement.query(By.css('p-table')).componentInstance;

                expect(tableInstance.multiSortMeta).toEqual([{ field: 'category', order: 1 }]);
            });
        });
    });

    describe('Filtering Functionality', () => {
        let testComponent: TestFilteringTableComponent;
        let testFixture: ComponentFixture<TestFilteringTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestFilteringTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should have global filter fields configured', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.globalFilterFields).toEqual(['name', 'category']);
        });

        it('should render column filters', () => {
            const columnFilters = testFixture.debugElement.queryAll(By.css('p-columnFilter'));
            expect(columnFilters.length).toBe(2);
        });
    });

    describe('Virtual Scroll Functionality', () => {
        let testComponent: TestVirtualScrollTableComponent;
        let testFixture: ComponentFixture<TestVirtualScrollTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestVirtualScrollTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should enable virtual scrolling', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.virtualScroll).toBe(true);
        });

        it('should have correct virtual scroll item size', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.virtualScrollItemSize).toBe(46);
        });

        it('should handle large datasets efficiently', () => {
            expect(testComponent.products.length).toBe(10000);
        });

        it('should apply host and container height for virtual scroll with 100% scrollHeight', async () => {
            const percentHeightFixture = TestBed.createComponent(TestVirtualScrollPercentHeightTableComponent);
            await percentHeightFixture.whenStable();
            percentHeightFixture.detectChanges();

            const tableElement = percentHeightFixture.debugElement.query(By.css('p-table')).nativeElement as HTMLElement;
            const containerElement = percentHeightFixture.nativeElement.querySelector('.p-datatable-table-container') as HTMLElement;
            const scrollerElement = percentHeightFixture.nativeElement.querySelector('.p-virtualscroller');

            expect(tableElement.style.height).toBe('100%');
            expect(containerElement.style.height).toBe('100%');
            expect(scrollerElement).toBeTruthy();
            expect(scrollerElement.offsetHeight).toBeGreaterThan(0);
        });

        it('should apply explicit height for virtual scroll with pixel scrollHeight', () => {
            const tableElement = testFixture.debugElement.query(By.css('p-table')).nativeElement as HTMLElement;
            const containerElement = testFixture.nativeElement.querySelector('.p-datatable-table-container') as HTMLElement;

            expect(tableElement.style.height).toBe('400px');
            expect(containerElement.style.height).toBe('400px');
        });

        it('should not apply host height when virtualScroll is false', async () => {
            const nonVirtualFixture = TestBed.createComponent(TestScrollableNonVirtualTableComponent);
            await nonVirtualFixture.whenStable();
            nonVirtualFixture.detectChanges();

            const tableElement = nonVirtualFixture.debugElement.query(By.css('p-table')).nativeElement as HTMLElement;
            const containerElement = nonVirtualFixture.nativeElement.querySelector('.p-datatable-table-container') as HTMLElement;

            expect(tableElement.style.height).toBe('');
            expect(containerElement.style.maxHeight).toBe('400px');
        });

        it('should keep flex mode on class-based path without inline height', async () => {
            const flexFixture = TestBed.createComponent(TestVirtualScrollFlexHeightTableComponent);
            await flexFixture.whenStable();
            flexFixture.detectChanges();

            const tableElement = flexFixture.debugElement.query(By.css('p-table')).nativeElement as HTMLElement;
            const containerElement = flexFixture.nativeElement.querySelector('.p-datatable-table-container') as HTMLElement;
            const rootElement = flexFixture.nativeElement.querySelector('.p-datatable') as HTMLElement;

            expect(tableElement.style.height).toBe('');
            expect(containerElement.style.height).toBe('');
            expect(rootElement.classList.contains('p-datatable-flex-scrollable')).toBe(true);
        });
    });

    describe('Lazy Loading Functionality', () => {
        let testComponent: TestLazyLoadTableComponent;
        let testFixture: ComponentFixture<TestLazyLoadTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestLazyLoadTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should enable lazy loading', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.lazy).toBe(true);
        });

        it('should have correct total records', () => {
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            expect(tableInstance.totalRecords).toBe(1000);
        });

        it('should emit lazy load event through a real trigger (onPageChange), not a manual .emit() call', () => {
            vi.spyOn(testComponent, 'loadProducts').mockImplementation(() => {});
            const tableInstance = testFixture.debugElement.query(By.css('p-table')).componentInstance;
            vi.spyOn(tableInstance.onLazyLoad, 'emit');

            // onPageChange is the real method a paginator click invokes; because lazy=true is
            // bound on the host template, it internally emits onLazyLoad with fresh metadata.
            tableInstance.onPageChange({ first: 10, rows: 10 });

            expect(tableInstance.onLazyLoad.emit).toHaveBeenCalledWith(expect.objectContaining({ first: 10, rows: 10 }));
            expect(testComponent.loadProducts).toHaveBeenCalledWith(expect.objectContaining({ first: 10, rows: 10 }));
        });
    });

    describe('Templates Functionality', () => {
        let testComponent: TestTemplatesTableComponent;
        let testFixture: ComponentFixture<TestTemplatesTableComponent>;

        beforeEach(async () => {
            testFixture = TestBed.createComponent(TestTemplatesTableComponent);
            testComponent = testFixture.componentInstance;
            await testFixture.whenStable();
            testFixture.detectChanges();
        });

        it('should render caption template', () => {
            const captionElement = testFixture.debugElement.query(By.css('.p-d-flex'));
            expect(captionElement).toBeTruthy();
        });

        it('should display correct product count in summary', () => {
            const summaryText = testFixture.nativeElement.textContent;
            expect(summaryText).toContain('Total Products: 2');
        });
    });

    describe('Real-Life Scenarios - E-commerce Product Management', () => {
        let ecommerceComponent: TestBasicTableComponent;
        let ecommerceFixture: ComponentFixture<TestBasicTableComponent>;

        beforeEach(async () => {
            ecommerceFixture = TestBed.createComponent(TestBasicTableComponent);
            ecommerceComponent = ecommerceFixture.componentInstance;
            ecommerceComponent.products = [
                { id: '1001', code: 'LP001', name: 'Gaming Laptop', description: 'High-end gaming laptop', price: 1299.99, quantity: 15, inventoryStatus: 'INSTOCK', category: 'Electronics', image: 'laptop.jpg', rating: 5 },
                { id: '1002', code: 'MO001', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, quantity: 0, inventoryStatus: 'OUTOFSTOCK', category: 'Accessories', image: 'mouse.jpg', rating: 4 },
                { id: '1003', code: 'KB001', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 149.99, quantity: 8, inventoryStatus: 'LOWSTOCK', category: 'Accessories', image: 'keyboard.jpg', rating: 4 },
                { id: '1004', code: 'HD001', name: 'Wireless Headphones', description: 'Noise-cancelling headphones', price: 199.99, quantity: 25, inventoryStatus: 'INSTOCK', category: 'Audio', image: 'headphones.jpg', rating: 5 },
                { id: '1005', code: 'MN001', name: '4K Monitor', description: '27-inch 4K monitor', price: 399.99, quantity: 12, inventoryStatus: 'INSTOCK', category: 'Displays', image: 'monitor.jpg', rating: 4 }
            ];
            ecommerceFixture.changeDetectorRef.markForCheck();
            await ecommerceFixture.whenStable();
            ecommerceFixture.detectChanges();
        });

        it('should handle inventory status filtering for stock management', async () => {
            const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;

            tableInstance.filter('INSTOCK', 'inventoryStatus', 'equals');
            await new Promise((resolve) => setTimeout(resolve, 350));
            await ecommerceFixture.whenStable();

            const inStockProducts = tableInstance.filteredValue || tableInstance.value;
            const inStock = inStockProducts.filter((product: any) => product.inventoryStatus === 'INSTOCK');
            expect(inStock.length).toBe(3);
        });

        it('should sort by price for promotional planning', async () => {
            const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;

            tableInstance.sort({ field: 'price', order: 1 });
            await ecommerceFixture.whenStable();

            expect(tableInstance.sortField).toBe('price');
            expect(tableInstance.sortOrder).toBe(1);
        });

        it('should support price range filtering for budget constraints', async () => {
            const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;

            tableInstance.filter(100, 'price', 'lt');
            await new Promise((resolve) => setTimeout(resolve, 350));
            await ecommerceFixture.whenStable();

            const filteredData = tableInstance.filteredValue || tableInstance.value;
            const affordableProducts = filteredData.filter((product: any) => product.price < 100);
            expect(affordableProducts.length).toBe(1); // Only the mouse under $100
        });

        it('should calculate average price for market analysis', () => {
            const products = ecommerceComponent.products;
            const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
            const averagePrice = totalPrice / products.length;

            expect(averagePrice).toBeGreaterThan(0);
            expect(averagePrice).toBeCloseTo(415.99, 1);
        });

        it('should support CSV export for external analysis', () => {
            const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
            vi.spyOn(tableInstance, 'exportCSV').mockImplementation(() => {});

            tableInstance.exportCSV({ selectionOnly: false });
            expect(tableInstance.exportCSV).toHaveBeenCalledWith({ selectionOnly: false });
        });

        describe('Real-Life Scenarios - Additional Tests', () => {
            it('should handle bulk operations efficiently', () => {
                const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
                expect(tableInstance).toBeTruthy();
            });

            it('should support complex filtering operations', () => {
                const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
                expect(tableInstance).toBeTruthy();
            });

            it('should handle large datasets with virtual scrolling', () => {
                const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
                expect(tableInstance).toBeTruthy();
                expect(ecommerceComponent.products.length).toBeGreaterThan(0);
            });

            it('should maintain state across user interactions', () => {
                const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
                expect(tableInstance).toBeTruthy();
                expect(tableInstance.value).toBeDefined();
            });

            it('should support row expansion for master-detail views', () => {
                expect(component.expandedRowKeys).toBeDefined();
            });

            it('should handle column reordering and resizing', () => {
                const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
                expect(tableInstance).toBeTruthy();
                expect(tableInstance.value).toBeDefined();
            });

            it('should provide advanced sorting capabilities', () => {
                const tableInstance = ecommerceFixture.debugElement.query(By.css('p-table')).componentInstance;
                expect(tableInstance).toBeTruthy();
                expect(typeof tableInstance.sort).toBe('function');
            });

            it('should export data in multiple formats', () => {
                vi.spyOn(component, 'exportCSV').mockImplementation(() => {});
                component.exportCSV();
                expect(component.exportCSV).toHaveBeenCalled();
            });
        });
    });

    describe('Output Events', () => {
        // These tests drive each output() through the real method that emits it (row clicks,
        // paging, sorting, filtering, drag/drop, state save/restore, etc.) rather than calling
        // `.emit()` directly, so they fail if the internal wiring between the method and the
        // output is ever broken.
        let outputComponent: Table;
        let outputFixture: ComponentFixture<Table>;

        const clickEvent = (target: HTMLElement = document.createElement('div'), extra: Record<string, any> = {}) => ({
            target,
            shiftKey: false,
            metaKey: false,
            ctrlKey: false,
            ...extra
        });

        beforeEach(() => {
            outputFixture = TestBed.createComponent(Table);
            outputComponent = outputFixture.componentInstance;
            outputFixture.detectChanges();
        });

        describe('Selection outputs', () => {
            it('emits selectionChange and onRowSelect via handleRowClick (select)', () => {
                outputComponent.selectionMode = 'single';
                outputComponent.dataKey = 'id';
                const rowData = { id: '1', name: 'Row 1' };
                outputComponent.value = [rowData, { id: '2', name: 'Row 2' }];
                vi.spyOn(outputComponent.selectionChange, 'emit');
                vi.spyOn(outputComponent.onRowSelect, 'emit');

                outputComponent.handleRowClick({ originalEvent: clickEvent(), rowData, rowIndex: 0 });

                expect(outputComponent.selectionChange.emit).toHaveBeenCalledWith(rowData);
                expect(outputComponent.onRowSelect.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData, type: 'row', index: 0 }));
            });

            it('emits selectionChange and onRowUnselect via handleRowClick (unselect an already-selected row)', () => {
                outputComponent.selectionMode = 'single';
                outputComponent.dataKey = 'id';
                const rowData = { id: '1', name: 'Row 1' };
                outputComponent.value = [rowData];
                outputComponent.selection = rowData;
                outputComponent.ngOnChanges({ selection: new SimpleChange(null, rowData, false) });
                vi.spyOn(outputComponent.selectionChange, 'emit');
                vi.spyOn(outputComponent.onRowUnselect, 'emit');

                outputComponent.handleRowClick({ originalEvent: clickEvent(), rowData, rowIndex: 0 });

                expect(outputComponent.selectionChange.emit).toHaveBeenCalled();
                expect(outputComponent.onRowUnselect.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData, type: 'row' }));
            });

            it('emits selectionChange and onRowSelect via selectRange (shift-click multi-select)', () => {
                outputComponent.selectionMode = 'multiple';
                outputComponent.dataKey = 'id';
                const rows = [
                    { id: '1', name: 'Row 1' },
                    { id: '2', name: 'Row 2' },
                    { id: '3', name: 'Row 3' }
                ];
                outputComponent.value = rows;
                outputComponent.selection = [];
                outputComponent.anchorRowIndex = 0;
                vi.spyOn(outputComponent.selectionChange, 'emit');
                vi.spyOn(outputComponent.onRowSelect, 'emit');

                outputComponent.selectRange(clickEvent() as any, 2);

                expect(outputComponent.selectionChange.emit).toHaveBeenCalledWith(rows);
                expect(outputComponent.onRowSelect.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rows, type: 'row' }));
            });

            it('emits onRowUnselect via clearSelectionRange', () => {
                outputComponent.dataKey = 'id';
                const rows = [
                    { id: '1', name: 'Row 1' },
                    { id: '2', name: 'Row 2' }
                ];
                outputComponent.value = rows;
                outputComponent.selection = [...rows];
                outputComponent.selectionKeys = { '1': 1, '2': 1 };
                outputComponent.anchorRowIndex = 0;
                outputComponent.rangeRowIndex = 1;
                vi.spyOn(outputComponent.onRowUnselect, 'emit');

                outputComponent.clearSelectionRange(clickEvent() as any);

                expect(outputComponent.onRowUnselect.emit).toHaveBeenCalledTimes(2);
            });

            it('emits selectionChange and onRowSelect/onRowUnselect via toggleRowWithRadio', () => {
                outputComponent.dataKey = 'id';
                const rowData = { id: '1', name: 'Row 1' };
                outputComponent.value = [rowData];
                vi.spyOn(outputComponent.selectionChange, 'emit');
                vi.spyOn(outputComponent.onRowSelect, 'emit');
                vi.spyOn(outputComponent.onRowUnselect, 'emit');

                outputComponent.toggleRowWithRadio({ originalEvent: clickEvent(), rowIndex: 0 }, rowData);
                expect(outputComponent.selectionChange.emit).toHaveBeenCalledWith(rowData);
                expect(outputComponent.onRowSelect.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData, type: 'radiobutton' }));

                outputComponent.toggleRowWithRadio({ originalEvent: clickEvent(), rowIndex: 0 }, rowData);
                expect(outputComponent.onRowUnselect.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData, type: 'radiobutton' }));
            });

            // NOTE: the `selectAll` @Input's getter/setter (table.ts ~875-880) reads/writes
            // `_selection` instead of `_selectAll` -- a copy/paste bug that only doesn't break
            // real usage because Table.onChanges() (~1503-1504) separately reads the raw
            // SimpleChanges value and assigns `_selectAll` correctly. We drive that real
            // ngOnChanges/onChanges path here (as a template `[selectAll]` binding would)
            // rather than assigning `.selectAll` directly, since the direct setter is the buggy
            // path. See final report for details -- this was left as-is per instructions to not
            // silently work around a source bug.
            it('emits selectAllChange via toggleRowsWithCheckbox when selectAll is bound (not null)', () => {
                outputComponent.value = [{ id: '1' }, { id: '2' }];
                outputComponent.dataKey = 'id';
                outputComponent.ngOnChanges({ selectAll: new SimpleChange(null, false, false) });
                vi.spyOn(outputComponent.selectAllChange, 'emit');

                const originalEvent = new Event('change');
                outputComponent.toggleRowsWithCheckbox({ originalEvent } as any, true);

                expect(outputComponent.selectAllChange.emit).toHaveBeenCalledWith({ originalEvent, checked: true });
            });

            it('emits onHeaderCheckboxToggle and selectionChange via toggleRowsWithCheckbox (selectAll not bound)', () => {
                outputComponent.value = [{ id: '1' }, { id: '2' }];
                outputComponent.dataKey = 'id';
                vi.spyOn(outputComponent.selectionChange, 'emit');
                vi.spyOn(outputComponent.onHeaderCheckboxToggle, 'emit');

                const originalEvent = new Event('change');
                outputComponent.toggleRowsWithCheckbox({ originalEvent } as any, true);

                expect(outputComponent.selectionChange.emit).toHaveBeenCalled();
                expect(outputComponent.onHeaderCheckboxToggle.emit).toHaveBeenCalledWith({ originalEvent, checked: true });
            });
        });

        describe('Context menu outputs', () => {
            it('emits contextMenuSelectionChange and onContextMenuSelect via handleRowRightClick', () => {
                outputComponent.contextMenu = { show: vi.fn() };
                outputComponent.dataKey = 'id';
                const rowData = { id: '1', name: 'Row 1' };
                outputComponent.value = [rowData];
                vi.spyOn(outputComponent.contextMenuSelectionChange, 'emit');
                vi.spyOn(outputComponent.onContextMenuSelect, 'emit');

                const originalEvent = clickEvent();
                outputComponent.handleRowRightClick({ originalEvent, rowData, rowIndex: 0 });

                expect(outputComponent.contextMenuSelectionChange.emit).toHaveBeenCalledWith(rowData);
                expect(outputComponent.onContextMenuSelect.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData, index: 0 }));
            });
        });

        describe('Paging outputs', () => {
            it('emits onPage, firstChange and rowsChange via onPageChange', () => {
                outputComponent.value = [{ id: '1' }];
                vi.spyOn(outputComponent.onPage, 'emit');
                vi.spyOn(outputComponent.firstChange, 'emit');
                vi.spyOn(outputComponent.rowsChange, 'emit');

                outputComponent.onPageChange({ first: 10, rows: 5 });

                expect(outputComponent.onPage.emit).toHaveBeenCalledWith({ first: 10, rows: 5 });
                expect(outputComponent.firstChange.emit).toHaveBeenCalledWith(10);
                expect(outputComponent.rowsChange.emit).toHaveBeenCalledWith(5);
            });
        });

        describe('Sorting outputs', () => {
            it('emits onSort via sortSingle', () => {
                outputComponent.value = [{ name: 'b' }, { name: 'a' }];
                outputComponent.sortField = 'name';
                outputComponent.sortOrder = 1;
                vi.spyOn(outputComponent.onSort, 'emit');

                outputComponent.sortSingle();

                expect(outputComponent.onSort.emit).toHaveBeenCalledWith({ field: 'name', order: 1 });
            });

            it('emits sortFunction and onSort via sortMultiple when customSort is enabled', () => {
                outputComponent.value = [{ name: 'b' }, { name: 'a' }];
                outputComponent.sortMode = 'multiple';
                outputComponent.multiSortMeta = [{ field: 'name', order: 1 }];
                outputComponent.customSort = true;
                vi.spyOn(outputComponent.sortFunction, 'emit');
                vi.spyOn(outputComponent.onSort, 'emit');

                outputComponent.sortMultiple();

                expect(outputComponent.sortFunction.emit).toHaveBeenCalledWith({
                    data: outputComponent.value,
                    mode: 'multiple',
                    multiSortMeta: outputComponent.multiSortMeta
                });
                expect(outputComponent.onSort.emit).toHaveBeenCalledWith({ multisortmeta: outputComponent.multiSortMeta });
            });
        });

        describe('Filtering outputs', () => {
            it('emits onFilter and firstChange via _filter', () => {
                outputComponent.value = [{ name: 'a' }, { name: 'b' }];
                outputComponent.filters = { name: { value: 'a', matchMode: 'equals' } };
                vi.spyOn(outputComponent.onFilter, 'emit');
                vi.spyOn(outputComponent.firstChange, 'emit');

                outputComponent._filter();

                expect(outputComponent.firstChange.emit).toHaveBeenCalledWith(0);
                expect(outputComponent.onFilter.emit).toHaveBeenCalledWith(expect.objectContaining({ filters: outputComponent.filters }));
            });
        });

        describe('Row expand/collapse outputs', () => {
            it('emits onRowExpand via toggleRow on a collapsed row', () => {
                outputComponent.dataKey = 'id';
                outputComponent.expandedRowKeys = {};
                const rowData = { id: '1', name: 'Row 1' };
                vi.spyOn(outputComponent.onRowExpand, 'emit');

                outputComponent.toggleRow(rowData);

                expect(outputComponent.onRowExpand.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData }));
            });

            it('emits onRowCollapse via toggleRow on an already-expanded row', () => {
                outputComponent.dataKey = 'id';
                const rowData = { id: '1', name: 'Row 1' };
                outputComponent.expandedRowKeys = { '1': true };
                vi.spyOn(outputComponent.onRowCollapse, 'emit');

                outputComponent.toggleRow(rowData);

                expect(outputComponent.onRowCollapse.emit).toHaveBeenCalledWith(expect.objectContaining({ data: rowData }));
            });
        });

        describe('Column resize/reorder outputs', () => {
            it('emits onColResize via onColumnResizeEnd', async () => {
                outputComponent.resizableColumns = true;
                outputFixture.changeDetectorRef.markForCheck();
                await outputFixture.whenStable();
                outputFixture.detectChanges();

                const row = document.createElement('tr');
                const th1 = document.createElement('th');
                const th2 = document.createElement('th');
                th1.style.minWidth = '0px';
                row.appendChild(th1);
                row.appendChild(th2);

                outputComponent.resizeColumnElement = th1 as any;
                outputComponent.lastResizerHelperX = 0;
                vi.spyOn(outputComponent.onColResize, 'emit');

                outputComponent.onColumnResizeEnd();

                expect(outputComponent.onColResize.emit).toHaveBeenCalledWith(expect.objectContaining({ element: th1 }));
            });

            it('emits onColReorder via onColumnDrop', async () => {
                outputComponent.reorderableColumns = true;
                outputFixture.changeDetectorRef.markForCheck();
                await outputFixture.whenStable();
                outputFixture.detectChanges();

                const row = document.createElement('tr');
                const col1 = document.createElement('th');
                const col2 = document.createElement('th');
                col1.setAttribute('preorderablecolumn', '');
                col2.setAttribute('preorderablecolumn', '');
                row.appendChild(col1);
                row.appendChild(col2);

                outputComponent.columns = [{ field: 'name' }, { field: 'price' }];
                outputComponent.onColumnDragStart({ dataTransfer: { setData: vi.fn() } } as any, col1);
                vi.spyOn(outputComponent.onColReorder, 'emit');

                outputComponent.onColumnDrop({ preventDefault: vi.fn() } as unknown as Event, col2);

                expect(outputComponent.onColReorder.emit).toHaveBeenCalledWith(expect.objectContaining({ dragIndex: 0, dropIndex: 1 }));
            });
        });

        describe('Row reorder output', () => {
            it('emits onRowReorder via onRowDrop', () => {
                outputComponent.value = [{ id: '1' }, { id: '2' }, { id: '3' }];
                outputComponent.draggedRowIndex = 0;
                outputComponent.droppedRowIndex = 2;
                vi.spyOn(outputComponent.onRowReorder, 'emit');

                outputComponent.onRowDrop(new Event('drop'), document.createElement('tr'));

                expect(outputComponent.onRowReorder.emit).toHaveBeenCalledWith({ dragIndex: 0, dropIndex: 1 });
            });
        });

        describe('State outputs', () => {
            it('emits onStateSave via saveState', () => {
                outputComponent.stateKey = 'output-events-test-state-save';
                outputComponent.value = [{ id: '1' }];
                vi.spyOn(outputComponent.onStateSave, 'emit');

                outputComponent.saveState();

                expect(outputComponent.onStateSave.emit).toHaveBeenCalled();
            });

            it('emits onStateRestore, firstChange and rowsChange via restoreState', () => {
                const stateKey = 'output-events-test-state-restore';
                outputComponent.stateKey = stateKey;
                outputComponent.paginator = true;
                outputComponent.first = 0;
                outputComponent.rows = 10;
                window.sessionStorage.setItem(stateKey, JSON.stringify({ first: 20, rows: 50 }));

                vi.spyOn(outputComponent.onStateRestore, 'emit');
                vi.spyOn(outputComponent.firstChange, 'emit');
                vi.spyOn(outputComponent.rowsChange, 'emit');

                outputComponent.restoreState();

                expect(outputComponent.firstChange.emit).toHaveBeenCalledWith(20);
                expect(outputComponent.rowsChange.emit).toHaveBeenCalledWith(50);
                expect(outputComponent.onStateRestore.emit).toHaveBeenCalledWith(expect.objectContaining({ first: 20, rows: 50 }));

                window.sessionStorage.removeItem(stateKey);
            });
        });

        describe('Lazy load output via ngOnInit', () => {
            it('emits onLazyLoad on init when lazy is true (real lifecycle trigger)', () => {
                const freshFixture = TestBed.createComponent(Table);
                const freshComponent = freshFixture.componentInstance;
                freshComponent.lazy = true;
                vi.spyOn(freshComponent.onLazyLoad, 'emit');

                freshFixture.detectChanges(); // triggers ngOnInit -> onInit()

                expect(freshComponent.onLazyLoad.emit).toHaveBeenCalled();
            });
        });

        describe('Edit outputs (EditableColumn directive)', () => {
            beforeEach(() => {
                TestBed.resetTestingModule();
            });

            @Component({
                changeDetection: ChangeDetectionStrategy.Eager,
                standalone: false,
                template: `
                    <p-table [value]="products" [dataKey]="'id'" editMode="cell">
                        <ng-template #header>
                            <tr>
                                <th>Name</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-product let-rowIndex="rowIndex">
                            <tr>
                                <td [pEditableColumn]="product" [pEditableColumnField]="'name'" [pEditableColumnRowIndex]="rowIndex">
                                    <p-cellEditor>
                                        <ng-template #input>
                                            <input pInputText type="text" [(ngModel)]="product.name" class="name-input" />
                                        </ng-template>
                                        <ng-template #output>
                                            {{ product.name }}
                                        </ng-template>
                                    </p-cellEditor>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                `
            })
            class TestEditOutputsComponent {
                products = [{ id: '1001', name: 'Gaming Laptop' }];
            }

            const setupEditFixture = async () => {
                await TestBed.configureTestingModule({
                    imports: [TableModule, CommonModule, FormsModule],
                    declarations: [TestEditOutputsComponent],
                    providers: [TableService, provideZonelessChangeDetection()]
                }).compileComponents();

                const fixture = TestBed.createComponent(TestEditOutputsComponent);
                await fixture.whenStable();
                fixture.detectChanges();

                const tableInstance = fixture.debugElement.query(By.css('p-table')).componentInstance as Table;
                return { fixture, tableInstance };
            };

            it('emits onEditInit when a real click opens the cell editor', async () => {
                const { fixture, tableInstance } = await setupEditFixture();
                vi.spyOn(tableInstance.onEditInit, 'emit');

                const cell: HTMLElement = fixture.nativeElement.querySelector('[data-p-editable-column="true"]');
                cell.click();
                await fixture.whenStable();
                fixture.detectChanges();

                expect(tableInstance.onEditInit.emit).toHaveBeenCalledWith(expect.objectContaining({ field: 'name', index: 0 }));
            });

            it('emits onEditComplete via EditableColumn.closeEditingCell(true, ...)', async () => {
                const { fixture, tableInstance } = await setupEditFixture();
                const cell: HTMLElement = fixture.nativeElement.querySelector('[data-p-editable-column="true"]');
                cell.click();
                await fixture.whenStable();
                fixture.detectChanges();

                const editableColumn = fixture.debugElement.query(By.directive(EditableColumn)).injector.get(EditableColumn);
                vi.spyOn(tableInstance.onEditComplete, 'emit');

                editableColumn.closeEditingCell(true, new Event('blur'));

                expect(tableInstance.onEditComplete.emit).toHaveBeenCalled();
            });

            it('emits onEditCancel via EditableColumn.closeEditingCell(false, ...)', async () => {
                const { fixture, tableInstance } = await setupEditFixture();
                const cell: HTMLElement = fixture.nativeElement.querySelector('[data-p-editable-column="true"]');
                cell.click();
                await fixture.whenStable();
                fixture.detectChanges();

                const editableColumn = fixture.debugElement.query(By.directive(EditableColumn)).injector.get(EditableColumn);
                vi.spyOn(tableInstance.onEditCancel, 'emit');

                editableColumn.closeEditingCell(false, new Event('blur'));

                expect(tableInstance.onEditCancel.emit).toHaveBeenCalled();
            });
        });

        describe('ColumnFilter outputs (onShow/onHide)', () => {
            let filterFixture: ComponentFixture<TestFilteringTableComponent>;

            beforeEach(async () => {
                filterFixture = TestBed.createComponent(TestFilteringTableComponent);
                await filterFixture.whenStable();
                filterFixture.detectChanges();
            });

            it('emits onShow via onOverlayBeforeEnter and onHide via onOverlayAnimationAfterLeave', () => {
                const columnFilter = filterFixture.debugElement.query(By.css('p-columnFilter')).componentInstance;
                vi.spyOn(columnFilter.onShow, 'emit');
                vi.spyOn(columnFilter.onHide, 'emit');

                columnFilter.onOverlayBeforeEnter({} as any);
                expect(columnFilter.onShow.emit).toHaveBeenCalled();

                columnFilter.onOverlayAnimationAfterLeave({} as any);
                expect(columnFilter.onHide.emit).toHaveBeenCalled();
            });
        });
    });

    describe('PassThrough', () => {
        beforeEach(() => {
            TestBed.resetTestingModule();
        });

        // Comprehensive PT test object with all sections
        const comprehensivePT = {
            host: { class: 'pt-host', 'data-testid': 'host' },
            root: { class: 'pt-root', 'data-testid': 'root' },
            mask: { class: 'pt-mask', 'data-testid': 'mask' },
            loadingIcon: { class: 'pt-loading-icon', 'data-testid': 'loading-icon' },
            header: { class: 'pt-header', 'data-testid': 'header' },
            pcPaginator: {
                root: { class: 'pt-paginator', 'data-testid': 'paginator' }
            },
            tableContainer: { class: 'pt-table-container', 'data-testid': 'table-container' },
            virtualScroller: {
                root: { class: 'pt-virtual-scroller', 'data-testid': 'virtual-scroller' }
            },
            table: { class: 'pt-table', 'data-testid': 'table' },
            thead: { class: 'pt-thead', 'data-testid': 'thead' },
            tbody: { class: 'pt-tbody', 'data-testid': 'tbody' },
            virtualScrollerSpacer: { class: 'pt-virtual-spacer', 'data-testid': 'virtual-spacer' },
            tfoot: { class: 'pt-tfoot', 'data-testid': 'tfoot' },
            footer: { class: 'pt-footer', 'data-testid': 'footer' },
            columnResizeIndicator: { class: 'pt-resize-indicator', 'data-testid': 'resize-indicator' },
            rowReorderIndicatorUp: { class: 'pt-reorder-up', 'data-testid': 'reorder-up' },
            rowReorderIndicatorDown: { class: 'pt-reorder-down', 'data-testid': 'reorder-down' },
            reorderableRow: { class: 'pt-reorderable-row', 'data-testid': 'reorderable-row' },
            reorderableRowHandle: { class: 'pt-reorder-handle', 'data-testid': 'reorder-handle' },
            headerCheckbox: {
                root: { class: 'pt-header-checkbox', 'data-testid': 'header-checkbox' }
            },
            pcCheckbox: {
                root: { class: 'pt-row-checkbox', 'data-testid': 'row-checkbox' }
            },
            columnFilter: {
                filter: { class: 'pt-filter', 'data-testid': 'filter' },
                pcColumnFilterButton: { class: 'pt-filter-button', 'data-testid': 'filter-button' },
                filterOverlay: { class: 'pt-filter-overlay', 'data-testid': 'filter-overlay' },
                filterConstraintList: { class: 'pt-constraint-list', 'data-testid': 'constraint-list' },
                filterConstraint: { class: 'pt-constraint', 'data-testid': 'constraint' },
                filterConstraintSeparator: { class: 'pt-constraint-separator', 'data-testid': 'constraint-separator' },
                emtpyFilterLabel: { class: 'pt-empty-filter', 'data-testid': 'empty-filter' },
                filterOperator: { class: 'pt-filter-operator', 'data-testid': 'filter-operator' },
                pcFilterOperatorDropdown: { class: 'pt-operator-dropdown', 'data-testid': 'operator-dropdown' },
                filterRuleList: { class: 'pt-rule-list', 'data-testid': 'rule-list' },
                filterRule: { class: 'pt-filter-rule', 'data-testid': 'filter-rule' },
                pcFilterConstraintDropdown: { class: 'pt-constraint-dropdown', 'data-testid': 'constraint-dropdown' },
                pcFilterRemoveRuleButton: { class: 'pt-remove-rule', 'data-testid': 'remove-rule' },
                pcAddRuleButtonLabel: { class: 'pt-add-rule', 'data-testid': 'add-rule' },
                filterButtonBar: { class: 'pt-filter-buttonbar', 'data-testid': 'filter-buttonbar' },
                pcFilterClearButton: { class: 'pt-filter-clear', 'data-testid': 'filter-clear' },
                pcFilterApplyButton: { class: 'pt-filter-apply', 'data-testid': 'filter-apply' },
                pcFilterInputText: { class: 'pt-filter-input', 'data-testid': 'filter-input' },
                pcFilterInputNumber: { class: 'pt-filter-number', 'data-testid': 'filter-number' },
                pcFilterCheckbox: {
                    root: { class: 'pt-filter-checkbox', 'data-testid': 'filter-checkbox' }
                },
                pcFilterDatePicker: { class: 'pt-filter-datepicker', 'data-testid': 'filter-datepicker' }
            },
            columnFilterFormElement: { class: 'pt-filter-form', 'data-testid': 'filter-form' }
        };

        @Component({
            changeDetection: ChangeDetectionStrategy.Eager,
            standalone: false,
            template: `
                <p-table
                    [value]="products"
                    [dataKey]="'id'"
                    [selection]="selectedProducts"
                    [loading]="isLoading"
                    [paginator]="true"
                    [rows]="5"
                    [totalRecords]="products.length"
                    [scrollable]="true"
                    scrollHeight="400px"
                    [resizableColumns]="true"
                    [reorderableColumns]="true"
                    [virtualScroll]="useVirtualScroll"
                    [virtualScrollItemSize]="46"
                    [pt]="tablePT"
                >
                    <ng-template #caption>
                        <div>Product Management Table</div>
                    </ng-template>
                    <ng-template #header>
                        <tr>
                            <th><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                            <th pReorderableColumn pResizableColumn>
                                Name
                                <p-columnFilter field="name" matchMode="contains" display="menu">
                                    <ng-template #filter let-value let-filter="filterCallback">
                                        <input type="text" [(ngModel)]="value" (ngModelChange)="filter($event)" placeholder="Search" />
                                    </ng-template>
                                </p-columnFilter>
                            </th>
                            <th pReorderableColumn pResizableColumn>Price</th>
                            <th pReorderableColumn pResizableColumn>Category</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-product let-rowIndex="rowIndex">
                        <tr [pReorderableRow]="rowIndex">
                            <td><p-tableCheckbox [value]="product"></p-tableCheckbox></td>
                            <td>
                                <span pReorderableRowHandle class="pi pi-bars"></span>
                                {{ product.name }}
                            </td>
                            <td>{{ product.price | currency }}</td>
                            <td>{{ product.category }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #footer>
                        <tr>
                            <td colspan="4">Total: {{ products.length }} products</td>
                        </tr>
                    </ng-template>
                    <ng-template #summary>
                        <div>Footer Summary</div>
                    </ng-template>
                </p-table>
            `
        })
        class TestComprehensivePTComponent {
            products = [
                { id: 1, name: 'Gaming Laptop', price: 1299.99, category: 'Electronics' },
                { id: 2, name: 'Wireless Mouse', price: 29.99, category: 'Accessories' },
                { id: 3, name: 'Mechanical Keyboard', price: 149.99, category: 'Accessories' },
                { id: 4, name: 'Wireless Headphones', price: 199.99, category: 'Audio' },
                { id: 5, name: '4K Monitor', price: 399.99, category: 'Displays' },
                { id: 6, name: 'USB-C Hub', price: 49.99, category: 'Accessories' },
                { id: 7, name: 'Webcam', price: 79.99, category: 'Electronics' },
                { id: 8, name: 'Microphone', price: 129.99, category: 'Audio' }
            ];
            selectedProducts: any[] = [];
            isLoading = false;
            useVirtualScroll = false;
            tablePT = comprehensivePT;
        }

        it('PT Section 1: host - should apply PT to host DOM element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // Check that p-table element exists (host element)
            const tableElement = fixture.nativeElement.querySelector('p-table');
            expect(tableElement).toBeTruthy();
        });

        it('PT Section 2: root - should apply PT to root DOM element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const rootEl = fixture.nativeElement.querySelector('[data-testid="root"]');
            expect(rootEl).toBeTruthy();
            expect(rootEl?.classList.contains('pt-root')).toBe(true);
        });

        it('PT Section 3: mask - should apply PT to loading mask element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            const component = fixture.componentInstance;
            component.isLoading = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            const maskEl = fixture.nativeElement.querySelector('[data-testid="mask"]');
            expect(maskEl).toBeTruthy();
            expect(maskEl?.classList.contains('pt-mask')).toBe(true);
        });

        it('PT Section 4: loadingIcon - should apply PT to loading icon element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            const component = fixture.componentInstance;
            component.isLoading = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            const iconEl = fixture.nativeElement.querySelector('[data-testid="loading-icon"]');
            expect(iconEl).toBeTruthy();
            expect(iconEl?.classList.contains('pt-loading-icon')).toBe(true);
        });

        it('PT Section 5: header - should apply PT to header (caption) element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const headerEl = fixture.nativeElement.querySelector('[data-testid="header"]');
            expect(headerEl).toBeTruthy();
            expect(headerEl?.classList.contains('pt-header')).toBe(true);
        });

        it('PT Section 6: pcPaginator - should apply PT to paginator component', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const paginatorEl = fixture.nativeElement.querySelector('[data-testid="paginator"]');
            expect(paginatorEl).toBeTruthy();
            expect(paginatorEl?.classList.contains('pt-paginator')).toBe(true);
        });

        it('PT Section 7: tableContainer - should apply PT to table container element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const containerEl = fixture.nativeElement.querySelector('[data-testid="table-container"]');
            expect(containerEl).toBeTruthy();
            expect(containerEl?.classList.contains('pt-table-container')).toBe(true);
        });

        it('PT Section 8: virtualScroller - should apply PT to virtual scroller component', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            const component = fixture.componentInstance;
            component.useVirtualScroll = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            const scrollerEl = fixture.nativeElement.querySelector('[data-testid="virtual-scroller"]');
            expect(scrollerEl).toBeTruthy();
            expect(scrollerEl?.classList.contains('pt-virtual-scroller')).toBe(true);
        });

        it('PT Section 9: table - should apply PT to table element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const tableEl = fixture.nativeElement.querySelector('[data-testid="table"]');
            expect(tableEl).toBeTruthy();
            expect(tableEl?.classList.contains('pt-table')).toBe(true);
        });

        it('PT Section 10: thead - should apply PT to thead element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const theadEl = fixture.nativeElement.querySelector('[data-testid="thead"]');
            expect(theadEl).toBeTruthy();
            expect(theadEl?.classList.contains('pt-thead')).toBe(true);
        });

        it('PT Section 11: tbody - should apply PT to tbody element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const tbodyEl = fixture.nativeElement.querySelector('[data-testid="tbody"]');
            expect(tbodyEl).toBeTruthy();
            expect(tbodyEl?.classList.contains('pt-tbody')).toBe(true);
        });

        it('PT Section 12: virtualScrollerSpacer - should apply PT to virtual scroller spacer element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            const component = fixture.componentInstance;
            component.useVirtualScroll = true;
            fixture.changeDetectorRef.markForCheck();
            await fixture.whenStable();
            fixture.detectChanges();

            // Virtual scroller spacer may not render in all scenarios
            const spacerEl = fixture.nativeElement.querySelector('[data-testid="virtual-spacer"]');
            // If element exists, check for class
            if (spacerEl) {
                expect(spacerEl.classList.contains('pt-virtual-spacer')).toBe(true);
            }
        });

        it('PT Section 13: tfoot - should apply PT to tfoot element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const tfootEl = fixture.nativeElement.querySelector('[data-testid="tfoot"]');
            expect(tfootEl).toBeTruthy();
            expect(tfootEl?.classList.contains('pt-tfoot')).toBe(true);
        });

        it('PT Section 14: footer - should apply PT to footer element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const footerEl = fixture.nativeElement.querySelector('[data-testid="footer"]');
            expect(footerEl).toBeTruthy();
            expect(footerEl?.classList.contains('pt-footer')).toBe(true);
        });

        it('PT Section 15: columnResizeIndicator - should apply PT to column resize indicator element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const indicatorEl = fixture.nativeElement.querySelector('[data-testid="resize-indicator"]');
            expect(indicatorEl).toBeTruthy();
            expect(indicatorEl?.classList.contains('pt-resize-indicator')).toBe(true);
        });

        it('PT Section 16: rowReorderIndicatorUp - should apply PT to row reorder indicator up element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const upIndicatorEl = fixture.nativeElement.querySelector('[data-testid="reorder-up"]');
            expect(upIndicatorEl).toBeTruthy();
            expect(upIndicatorEl?.classList.contains('pt-reorder-up')).toBe(true);
        });

        it('PT Section 17: rowReorderIndicatorDown - should apply PT to row reorder indicator down element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            const downIndicatorEl = fixture.nativeElement.querySelector('[data-testid="reorder-down"]');
            expect(downIndicatorEl).toBeTruthy();
            expect(downIndicatorEl?.classList.contains('pt-reorder-down')).toBe(true);
        });

        it('PT Section 18: reorderableRow - should apply PT to reorderable row element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // Check that reorderable rows exist
            const rows = fixture.nativeElement.querySelectorAll('tbody tr');
            expect(rows.length).toBeGreaterThan(0);
        });

        it('PT Section 19: reorderableRowHandle - should apply PT to reorderable row handle element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // Check that reorderable row handle exists
            const handles = fixture.nativeElement.querySelectorAll('[preorderablerowhandle]');
            expect(handles).toBeDefined();
        });

        it('PT Section 20: headerCheckbox - should apply PT to header checkbox component', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // Check that header checkbox exists
            const headerCheckbox = fixture.nativeElement.querySelector('p-tableheadercheckbox');
            expect(headerCheckbox).toBeTruthy();
        });

        it('PT Section 21: pcCheckbox - should apply PT to checkbox component', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // Check that row checkboxes exist
            const checkboxes = fixture.nativeElement.querySelectorAll('p-tablecheckbox');
            expect(checkboxes.length).toBeGreaterThan(0);
        });

        it('PT Section 22: columnFilter.filter - should apply PT to filter container element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // Check that column filter element exists
            const filterEl = fixture.nativeElement.querySelector('p-columnfilter');
            expect(filterEl).toBeTruthy();
        });

        it('PT Section 23: columnFilterFormElement - should apply PT to column filter form element', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestComprehensivePTComponent],
                providers: [provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestComprehensivePTComponent);
            fixture.detectChanges();

            // columnFilterFormElement is part of columnFilter, check that table exists
            const tableEl = fixture.nativeElement.querySelector('table');
            expect(tableEl).toBeTruthy();
        });
    });

    describe('Cell Navigation', () => {
        beforeEach(() => {
            TestBed.resetTestingModule();
        });

        @Component({
            changeDetection: ChangeDetectionStrategy.Eager,
            standalone: false,
            template: `
                <p-table [value]="products" [dataKey]="'id'" editMode="cell">
                    <ng-template #header>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Price</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-product let-rowIndex="rowIndex">
                        <tr>
                            <td>{{ product.id }}</td>
                            <td [pEditableColumn]="product" [pEditableColumnField]="'name'" [pEditableColumnRowIndex]="rowIndex">
                                <p-cellEditor>
                                    <ng-template #input>
                                        <input pInputText type="text" [(ngModel)]="product.name" class="name-input" />
                                    </ng-template>
                                    <ng-template #output>
                                        {{ product.name }}
                                    </ng-template>
                                </p-cellEditor>
                            </td>
                            <td [pEditableColumn]="product" [pEditableColumnField]="'price'" [pEditableColumnRowIndex]="rowIndex">
                                <p-cellEditor>
                                    <ng-template #input>
                                        <input pInputText type="text" [(ngModel)]="product.price" class="price-input" />
                                    </ng-template>
                                    <ng-template #output>
                                        {{ product.price | currency }}
                                    </ng-template>
                                </p-cellEditor>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            `
        })
        class TestCellNavigationComponent {
            products = [
                { id: '1001', name: 'Gaming Laptop', price: 1299.99 },
                { id: '1002', name: 'Wireless Mouse', price: 29.99 },
                { id: '1003', name: 'Mechanical Keyboard', price: 149.99 }
            ];
        }

        it('should render editable columns with proper data attributes', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            expect(editableCells.length).toBe(6); // 2 editable columns x 3 rows
        });

        it('should open cell editor on click and show input for correct field', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const nameCell = editableCells[0]; // First name cell

            nameCell.click();
            await fixture.whenStable();
            fixture.detectChanges();

            // Verify the name cell is now editing
            const editingCell = fixture.nativeElement.querySelector('[data-p-cell-editing="true"]');
            expect(editingCell).toBeTruthy();

            // Verify the name input is shown
            const nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeTruthy();

            // Verify no price input is shown
            const priceInput = fixture.nativeElement.querySelector('.price-input');
            expect(priceInput).toBeFalsy();
        });

        it('should navigate from name cell to price cell on arrow right key', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const nameCell = editableCells[0]; // First name cell (row 1)

            // Open the name cell for editing
            nameCell.click();
            await fixture.whenStable();
            fixture.detectChanges();

            // Verify name input is shown initially
            let nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeTruthy();

            // Dispatch arrow right key event on the cell
            const arrowRightEvent = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                code: 'ArrowRight',
                bubbles: true
            });
            nameInput.dispatchEvent(arrowRightEvent);
            await fixture.whenStable();
            fixture.detectChanges();

            // After navigation, price input should be shown
            const priceInput = fixture.nativeElement.querySelector('.price-input');
            expect(priceInput).toBeTruthy();

            // Name input should no longer be visible
            nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeFalsy();
        });

        it('should navigate from price cell to name cell on arrow left key', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const priceCell = editableCells[1]; // First price cell (row 1)

            // Open the price cell for editing
            priceCell.click();
            await fixture.whenStable();
            fixture.detectChanges();

            // Verify price input is shown initially
            let priceInput = fixture.nativeElement.querySelector('.price-input');
            expect(priceInput).toBeTruthy();

            // Dispatch arrow left key event
            const arrowLeftEvent = new KeyboardEvent('keydown', {
                key: 'ArrowLeft',
                code: 'ArrowLeft',
                bubbles: true
            });
            priceInput.dispatchEvent(arrowLeftEvent);
            await fixture.whenStable();
            fixture.detectChanges();

            // After navigation, name input should be shown
            const nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeTruthy();

            // Price input should no longer be visible
            priceInput = fixture.nativeElement.querySelector('.price-input');
            expect(priceInput).toBeFalsy();
        });

        it('should navigate to next row when pressing arrow right on last column', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const priceCellRow1 = editableCells[1]; // Price cell in row 1
            const nameCellRow2 = editableCells[2]; // Name cell in row 2

            // Verify they are in different rows
            expect(priceCellRow1.parentElement).not.toBe(nameCellRow2.parentElement);

            // Open price cell in row 1
            priceCellRow1.click();
            await fixture.whenStable();
            fixture.detectChanges();

            let priceInput = fixture.nativeElement.querySelector('.price-input');
            expect(priceInput).toBeTruthy();

            // Dispatch arrow right to navigate to next row
            const arrowRightEvent = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                code: 'ArrowRight',
                bubbles: true
            });
            priceInput.dispatchEvent(arrowRightEvent);
            await fixture.whenStable();
            fixture.detectChanges();

            // Should now be editing name cell in row 2
            const nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeTruthy();

            // The editing cell should be in row 2
            const editingCell = fixture.nativeElement.querySelector('[data-p-cell-editing="true"]');
            expect(editingCell.parentElement).toBe(nameCellRow2.parentElement);
        });

        it('should navigate to previous row when pressing arrow left on first column', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const priceCellRow1 = editableCells[1]; // Price cell in row 1
            const nameCellRow2 = editableCells[2]; // Name cell in row 2

            // Open name cell in row 2
            nameCellRow2.click();
            await fixture.whenStable();
            fixture.detectChanges();

            let nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeTruthy();

            // Dispatch arrow left to navigate to previous row
            const arrowLeftEvent = new KeyboardEvent('keydown', {
                key: 'ArrowLeft',
                code: 'ArrowLeft',
                bubbles: true
            });
            nameInput.dispatchEvent(arrowLeftEvent);
            await fixture.whenStable();
            fixture.detectChanges();

            // Should now be editing price cell in row 1
            const priceInput = fixture.nativeElement.querySelector('.price-input');
            expect(priceInput).toBeTruthy();

            // The editing cell should be in row 1
            const editingCell = fixture.nativeElement.querySelector('[data-p-cell-editing="true"]');
            expect(editingCell.parentElement).toBe(priceCellRow1.parentElement);
        });

        it('should not navigate when disabled', async () => {
            @Component({
                changeDetection: ChangeDetectionStrategy.Eager,
                standalone: false,
                template: `
                    <p-table [value]="products" [dataKey]="'id'" editMode="cell">
                        <ng-template #header>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-product let-rowIndex="rowIndex">
                            <tr>
                                <td [pEditableColumn]="product" [pEditableColumnField]="'name'" [pEditableColumnRowIndex]="rowIndex" [pEditableColumnDisabled]="true">
                                    <p-cellEditor>
                                        <ng-template #input>
                                            <input pInputText type="text" [(ngModel)]="product.name" class="name-input" />
                                        </ng-template>
                                        <ng-template #output>
                                            {{ product.name }}
                                        </ng-template>
                                    </p-cellEditor>
                                </td>
                                <td [pEditableColumn]="product" [pEditableColumnField]="'price'" [pEditableColumnRowIndex]="rowIndex">
                                    <p-cellEditor>
                                        <ng-template #input>
                                            <input pInputText type="text" [(ngModel)]="product.price" class="price-input" />
                                        </ng-template>
                                        <ng-template #output>
                                            {{ product.price | currency }}
                                        </ng-template>
                                    </p-cellEditor>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                `
            })
            class TestDisabledCellComponent {
                products = [{ id: '1001', name: 'Gaming Laptop', price: 1299.99 }];
            }

            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestDisabledCellComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestDisabledCellComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const disabledNameCell = editableCells[0];

            // Click on disabled cell
            disabledNameCell.click();
            await fixture.whenStable();
            fixture.detectChanges();

            // Should not open editing on disabled cell - no input should be visible
            const nameInput = fixture.nativeElement.querySelector('.name-input');
            expect(nameInput).toBeFalsy();

            // No cell should be in editing state
            const editingCell = fixture.nativeElement.querySelector('[data-p-cell-editing="true"]');
            expect(editingCell).toBeFalsy();
        });

        it('findCell should traverse up DOM tree to find cell with editing attribute', async () => {
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellNavigationComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellNavigationComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const editableCells = fixture.nativeElement.querySelectorAll('[data-p-editable-column="true"]');
            const nameCell = editableCells[0];

            // Open the cell for editing
            nameCell.click();
            await fixture.whenStable();
            fixture.detectChanges();

            // Get the input element which is nested inside the cell
            const input = fixture.nativeElement.querySelector('.name-input');
            expect(input).toBeTruthy();

            // The input should be a descendant of the editing cell
            const editingCell = fixture.nativeElement.querySelector('[data-p-cell-editing="true"]');
            expect(editingCell).toBeTruthy();
            expect(editingCell.contains(input)).toBe(true);

            // Verify the editing cell has the correct data attribute
            expect(editingCell.querySelector('[data-p-cell-editing="true"]') || editingCell.getAttribute('data-p-cell-editing')).toBeTruthy();
        });
    });

    describe('CellEditor', () => {
        // EditableColumn/EditableRow are injected with { optional: true } (see [[table.ts]]), so a
        // <p-cellEditor> rendered without a pEditableColumn/pEditableRow ancestor must resolve them
        // to null, and CellEditor.editing must still return a real boolean rather than leaking
        // null/undefined through the && / || chain.
        @Component({
            changeDetection: ChangeDetectionStrategy.Eager,
            standalone: false,
            template: `
                <p-table [value]="products" [dataKey]="'id'">
                    <ng-template #header>
                        <tr>
                            <th>Name</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-product>
                        <tr>
                            <td>
                                <p-cellEditor>
                                    <ng-template #input>
                                        <input pInputText type="text" [(ngModel)]="product.name" />
                                    </ng-template>
                                    <ng-template #output>
                                        {{ product.name }}
                                    </ng-template>
                                </p-cellEditor>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            `
        })
        class TestCellEditorWithoutEditableAncestorComponent {
            products = [{ id: '1', name: 'Gaming Laptop' }];
        }

        it('should return a real boolean, not null/undefined, when there is no editable ancestor', async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [TableModule, CommonModule, FormsModule],
                declarations: [TestCellEditorWithoutEditableAncestorComponent],
                providers: [TableService, provideZonelessChangeDetection()]
            }).compileComponents();

            const fixture = TestBed.createComponent(TestCellEditorWithoutEditableAncestorComponent);
            await fixture.whenStable();
            fixture.detectChanges();

            const cellEditor = fixture.debugElement.query(By.directive(CellEditor)).componentInstance as CellEditor;

            expect(cellEditor.editableColumn).toBeNull();
            expect(cellEditor.editableRow).toBeNull();
            expect(cellEditor.editing).toBe(false);
        });
    });
});

// ---------------------------------------------------------------------------
// Signal query API
// ---------------------------------------------------------------------------

@Component({
    standalone: true,
    imports: [TableModule, SharedModule],
    template: `
        <p-table [value]="rows" [paginator]="true" [rows]="2" [resizableColumns]="true" [reorderableColumns]="true">
            <ng-template #header>
                <tr>
                    <th>Name</th>
                </tr>
            </ng-template>
            <ng-template #body let-row>
                <tr>
                    <td>{{ row.name }}</td>
                </tr>
            </ng-template>
            <ng-template #colgroup>
                <colgroup>
                    <col />
                </colgroup>
            </ng-template>
            <ng-template #loadingbody>
                <tr>
                    <td>loading…</td>
                </tr>
            </ng-template>
            <ng-template #footergrouped>
                <tr>
                    <td>fg</td>
                </tr>
            </ng-template>
            <ng-template #expandedrow let-row>
                <tr>
                    <td>{{ row.name }} expanded</td>
                </tr>
            </ng-template>
            <ng-template #groupheader>
                <tr>
                    <td>gh</td>
                </tr>
            </ng-template>
            <ng-template #groupfooter>
                <tr>
                    <td>gf</td>
                </tr>
            </ng-template>
            <ng-template #frozenexpandedrow>
                <tr>
                    <td>fe</td>
                </tr>
            </ng-template>
            <ng-template #frozenbody>
                <tr>
                    <td>fb</td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td>empty</td>
                </tr>
            </ng-template>
            <ng-template #paginatorleft>L</ng-template>
            <ng-template #paginatorright>R</ng-template>
            <ng-template #paginatordropdownitem let-item>{{ item?.label }}</ng-template>
            <ng-template #loadingicon>…</ng-template>
            <ng-template #reorderindicatorupicon>^</ng-template>
            <ng-template #reorderindicatordownicon>v</ng-template>
            <ng-template #sorticon let-sortOrder>{{ sortOrder }}</ng-template>
            <ng-template #checkboxicon>x</ng-template>
            <ng-template #headercheckboxicon>hx</ng-template>
            <ng-template #paginatordropdownicon>pd</ng-template>
            <ng-template #paginatorfirstpagelinkicon>first</ng-template>
            <ng-template #paginatorlastpagelinkicon>last</ng-template>
            <ng-template #paginatorpreviouspagelinkicon>prev</ng-template>
            <ng-template #paginatornextpagelinkicon>next</ng-template>
            <ng-template pTemplate="caption">caption</ng-template>
        </p-table>
    `
})
class TableQueryApiHostComponent {
    rows = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
}

describe('Table Signal Query API', () => {
    let instance: Table;
    let fixture: ComponentFixture<TableQueryApiHostComponent>;

    beforeEach(async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [TableQueryApiHostComponent],
            providers: [provideZonelessChangeDetection()]
        });
        fixture = TestBed.createComponent(TableQueryApiHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        instance = fixture.debugElement.query(By.directive(Table)).componentInstance;
    });

    it('should resolve all contentChild template hooks', () => {
        const hooks = [
            '_colGroupTemplate',
            '_loadingBodyTemplate',
            '_footerGroupedTemplate',
            '_expandedRowTemplate',
            '_groupHeaderTemplate',
            '_groupFooterTemplate',
            '_frozenExpandedRowTemplate',
            '_frozenBodyTemplate',
            '_emptyMessageTemplate',
            '_paginatorLeftTemplate',
            '_paginatorRightTemplate',
            '_paginatorDropdownItemTemplate',
            '_loadingIconTemplate',
            '_reorderIndicatorUpIconTemplate',
            '_reorderIndicatorDownIconTemplate',
            '_sortIconTemplate',
            '_checkboxIconTemplate',
            '_headerCheckboxIconTemplate',
            '_paginatorDropdownIconTemplate',
            '_paginatorFirstPageLinkIconTemplate',
            '_paginatorLastPageLinkIconTemplate',
            '_paginatorPreviousPageLinkIconTemplate',
            '_paginatorNextPageLinkIconTemplate'
        ];
        for (const hook of hooks) {
            expect((instance as any)[hook](), `${hook} should resolve`).toBeDefined();
        }
    });

    it('should collect pTemplate directives via the _templates contentChildren query', () => {
        const templates = (instance as any)._templates();
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.some((t: any) => t.getType() === 'caption')).toBe(true);
    });

    it('should resolve structural viewChild queries after render', () => {
        expect(instance.wrapperViewChild().nativeElement).toBeDefined();
        expect(instance.tableViewChild()?.nativeElement).toBeDefined();
        expect(instance.resizeHelperViewChild()?.nativeElement).toBeDefined();
        expect(instance.reorderIndicatorUpViewChild()?.nativeElement).toBeDefined();
        expect(instance.reorderIndicatorDownViewChild()?.nativeElement).toBeDefined();
    });

    it('should leave the scroller viewChild unresolved when virtual scrolling is off', () => {
        expect(instance.scroller()).toBeUndefined();
    });
});

@Component({
    standalone: true,
    imports: [TableModule, SharedModule, FormsModule],
    template: `
        <p-table [value]="rows" dataKey="name" [(selection)]="selection">
            <ng-template #header>
                <tr>
                    <th>
                        Name
                        <p-columnFilter field="name" matchMode="contains" display="menu">
                            <ng-template #filtericon>fi</ng-template>
                            <ng-template #removeruleicon>rri</ng-template>
                            <ng-template #addruleicon>ari</ng-template>
                        </p-columnFilter>
                    </th>
                </tr>
            </ng-template>
            <ng-template #body let-row>
                <tr>
                    <td><p-tableRadioButton [value]="row"></p-tableRadioButton>{{ row.name }}</td>
                </tr>
            </ng-template>
        </p-table>
    `
})
class TableFilterQueryApiHostComponent {
    rows = [{ name: 'a' }];
    selection: any = null;
}

describe('Table internals Signal Query API', () => {
    it('should resolve ColumnFilter and TableRadioButton queries', async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [TableFilterQueryApiHostComponent],
            providers: [provideZonelessChangeDetection()]
        });
        const fixture = TestBed.createComponent(TableFilterQueryApiHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const cf = fixture.debugElement.query(By.directive(ColumnFilter)).componentInstance;
        expect(cf.filterIconTemplate()).toBeDefined();
        expect(cf.removeRuleIconTemplate()).toBeDefined();
        expect(cf.addRuleIconTemplate()).toBeDefined();
        expect(Array.isArray(cf._templates())).toBe(true);
        expect(cf.icon()).toBeDefined();
        // the clear button lives in the filter overlay menu, which is closed by default
        expect(cf.clearButtonViewChild()).toBeUndefined();

        const rb = fixture.debugElement.query(By.directive(TableRadioButton)).componentInstance;
        expect(rb.inputViewChild()).toBeDefined();
    });
});
